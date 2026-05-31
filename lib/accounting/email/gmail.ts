// Gmail API で請求書メールを送信する。
// 既存の Google サービスアカウント（Sheets 読取りで使用中）に
// ドメイン全体の委任（gmail.send スコープ）を設定し、送信元ユーザーを impersonate する。
//
// 必要な環境変数:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL        … 既存（Sheets と共用）
//   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY  … 既存（\n エスケープ可）
//   MAIL_SENDER                         … 送信元/impersonate するユーザー（既定 kohei.uda@mesut.co.jp）
//   MAIL_SENDER_NAME                    … 表示名（既定 株式会社Mesut）

import { google } from "googleapis";
import { buildMimeBase64Url, type MimeInput } from "./mime";

export const MAIL_SENDER = process.env.MAIL_SENDER ?? "kohei.uda@mesut.co.jp";
export const MAIL_SENDER_NAME = process.env.MAIL_SENDER_NAME ?? "株式会社Mesut";

function getGmailClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY が未設定です",
    );
  }
  const key = rawKey.replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/gmail.send"],
    // ドメイン全体の委任で送信元ユーザーになりすます（Sent にも残る）
    subject: MAIL_SENDER,
  });
  return google.gmail({ version: "v1", auth });
}

export type SendInvoiceMailInput = {
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  attachment: { filename: string; content: Buffer };
};

export async function sendInvoiceMail(
  input: SendInvoiceMailInput,
): Promise<{ id: string | null | undefined }> {
  const gmail = getGmailClient();
  const mime: MimeInput = {
    fromName: MAIL_SENDER_NAME,
    fromEmail: MAIL_SENDER,
    to: input.to,
    cc: input.cc,
    subject: input.subject,
    body: input.body,
    attachment: {
      filename: input.attachment.filename,
      content: input.attachment.content,
      contentType: "application/pdf",
    },
  };
  const raw = buildMimeBase64Url(mime);
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
  return { id: res.data.id };
}

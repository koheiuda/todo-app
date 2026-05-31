// RFC822 MIME メッセージ（PDF添付つき）を組み立て、Gmail API 用の base64url 文字列にする。
// 日本語の件名・添付ファイル名・本文は適切にエンコードする。

function base64(buf: Buffer): string {
  // 76文字ごとに改行（MIME 推奨）
  return buf.toString("base64").replace(/(.{76})/g, "$1\r\n");
}

/** RFC2047 encoded-word（件名・表示名の日本語用） */
function encodeWord(s: string): string {
  // ASCIIのみならそのまま
  if (/^[\x20-\x7e]*$/.test(s)) return s;
  return `=?UTF-8?B?${Buffer.from(s, "utf-8").toString("base64")}?=`;
}

/** RFC2231 filename*（添付ファイル名の日本語用） */
function encodeFilename(name: string): string {
  return `UTF-8''${encodeURIComponent(name)}`;
}

export type MimeInput = {
  fromName: string;
  fromEmail: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  attachment: { filename: string; content: Buffer; contentType: string };
};

export function buildMimeBase64Url(input: MimeInput): string {
  const boundary = "mesut_invoice_boundary_0000";
  const headers: string[] = [
    `From: ${encodeWord(input.fromName)} <${input.fromEmail}>`,
    `To: ${input.to.join(", ")}`,
  ];
  if (input.cc.length > 0) headers.push(`Cc: ${input.cc.join(", ")}`);
  headers.push(
    `Subject: ${encodeWord(input.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  );

  const parts: string[] = [
    headers.join("\r\n"),
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    base64(Buffer.from(input.body, "utf-8")),
    `--${boundary}`,
    `Content-Type: ${input.attachment.contentType}`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename*=${encodeFilename(input.attachment.filename)}`,
    "",
    base64(input.attachment.content),
    `--${boundary}--`,
    "",
  ];

  const raw = parts.join("\r\n");
  return Buffer.from(raw, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

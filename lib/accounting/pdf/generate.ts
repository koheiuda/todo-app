import {
  InvoiceDocument,
  type CompanyInfo,
  type InvoiceForPdf,
} from "@/components/accounting/invoice-pdf/InvoiceDocument";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { getCompanySettings } from "@/lib/accounting/queries";

export async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    const s = await getCompanySettings();
    return {
      name: s.name,
      address: [s.postalCode ? `〒${s.postalCode}` : null, s.address]
        .filter(Boolean)
        .join(" "),
      tel: s.tel ?? "",
      invoiceNumber: s.invoiceNumber ?? "",
      bankInfo:
        s.bankInfo ??
        "GMOあおぞらネット銀行 法人営業部 普通 2091728 カ)メスト",
    };
  } catch {
    return {
      name: process.env.COMPANY_NAME ?? "株式会社Mesut",
      address: process.env.COMPANY_ADDRESS ?? "",
      tel: process.env.COMPANY_TEL ?? "",
      invoiceNumber: process.env.COMPANY_INVOICE_NUMBER ?? "",
      bankInfo:
        process.env.COMPANY_BANK_INFO ??
        "GMOあおぞらネット銀行 法人営業部 普通 2091728 カ)メスト",
    };
  }
}

export async function generateInvoicePdf(
  invoice: InvoiceForPdf,
): Promise<Buffer> {
  const company = await getCompanyInfo();
  const element = createElement(InvoiceDocument, {
    invoice,
    company,
  }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(element);
}

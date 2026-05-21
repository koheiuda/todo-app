import { PageHeader } from "@/components/accounting/page-header";
import { getCompanySettings } from "@/lib/accounting/queries";
import { CompanyForm } from "./_components/company-form";

export const metadata = { title: "自社情報 | Mesut 会計管理" };
export const dynamic = "force-dynamic";

export default async function CompanyPage() {
  const settings = await getCompanySettings();

  return (
    <div>
      <PageHeader
        title="自社情報"
        description="請求書PDFの発行元として表示される会社情報"
      />
      <CompanyForm initial={settings} />
    </div>
  );
}

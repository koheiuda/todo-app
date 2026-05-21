import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import path from "node:path";

const FONT_DIR = path.join(process.cwd(), "public", "fonts");

Font.register({
  family: "NotoSansJP",
  fonts: [
    {
      src: path.join(FONT_DIR, "NotoSansJP-Regular.otf"),
      fontWeight: "normal",
    },
    {
      src: path.join(FONT_DIR, "NotoSansJP-Bold.otf"),
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 48,
    fontFamily: "NotoSansJP",
    fontSize: 9,
    color: "#171717",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  clientBlock: {
    width: "55%",
  },
  clientName: {
    fontSize: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#171717",
    paddingBottom: 4,
    marginTop: 12,
  },
  rightBlock: {
    width: "40%",
    alignItems: "flex-end",
  },
  invoiceTitleBox: {
    backgroundColor: "#171717",
    color: "#ffffff",
    paddingVertical: 6,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  invoiceTitleText: {
    color: "#ffffff",
    fontSize: 13,
    letterSpacing: 4,
    fontWeight: "bold",
  },
  issueDateRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  issueDateLabel: {
    marginRight: 12,
    color: "#525252",
  },
  companyName: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 6,
  },
  smallText: {
    fontSize: 8,
    color: "#404040",
    lineHeight: 1.4,
  },
  intro: {
    marginVertical: 18,
    fontSize: 9,
  },
  summaryBoxes: {
    flexDirection: "row",
    marginBottom: 24,
  },
  summaryCell: {
    flex: 1,
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: "#171717",
  },
  summaryLabel: {
    backgroundColor: "#E5E5E5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: "40%",
    textAlign: "center",
    fontSize: 9,
    fontWeight: "bold",
  },
  summaryValue: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    textAlign: "right",
    fontSize: 10,
    fontWeight: "bold",
  },
  table: {
    borderWidth: 0.5,
    borderColor: "#171717",
    borderBottomWidth: 0,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#404040",
    color: "#ffffff",
  },
  tableHeaderCell: {
    color: "#ffffff",
    paddingVertical: 5,
    paddingHorizontal: 4,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 9,
    borderRightWidth: 0.5,
    borderRightColor: "#ffffff",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#171717",
    minHeight: 20,
  },
  tableCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 9,
    borderRightWidth: 0.5,
    borderRightColor: "#171717",
  },
  colNo: { width: "8%", textAlign: "center" },
  colDesc: { width: "40%" },
  colDate: { width: "16%", textAlign: "center" },
  colUnit: { width: "11%", textAlign: "right" },
  colQty: { width: "8%", textAlign: "right" },
  colAmount: { width: "17%", textAlign: "right" },
  totalsTable: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 0,
  },
  totalsBlock: {
    width: "36%",
    borderWidth: 0.5,
    borderColor: "#171717",
    borderTopWidth: 0,
  },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: "#171717",
  },
  totalLabel: {
    backgroundColor: "#404040",
    color: "#ffffff",
    paddingVertical: 4,
    paddingHorizontal: 8,
    width: "45%",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 9,
  },
  totalValue: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    flex: 1,
    textAlign: "right",
    fontSize: 9,
  },
  bankBlock: {
    marginTop: 30,
  },
  bankTitle: {
    fontWeight: "bold",
    marginBottom: 4,
    fontSize: 9,
  },
  bankLine: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  invoiceRegistration: {
    marginTop: 12,
    fontSize: 8,
    color: "#404040",
  },
});

export type InvoiceLineItemForPdf = {
  description: string;
  deliveryDate: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type InvoiceForPdf = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientHonorific: string;
  amountExclTax: number;
  taxAmount: number;
  amountInclTax: number;
  memo: string | null;
  lineItems: InvoiceLineItemForPdf[];
};

export type CompanyInfo = {
  name: string;
  address: string;
  tel: string;
  invoiceNumber: string;
  bankInfo: string;
};

function yen(n: number) {
  return `¥${n.toLocaleString("ja-JP")}`;
}

const ROWS_PER_PAGE = 17;

function padRows(items: InvoiceLineItemForPdf[]): InvoiceLineItemForPdf[] {
  const padded = [...items];
  while (padded.length < ROWS_PER_PAGE) {
    padded.push({
      description: "",
      deliveryDate: null,
      unitPrice: 0,
      quantity: 0,
      subtotal: 0,
    });
  }
  return padded;
}

export function InvoiceDocument({
  invoice,
  company,
}: {
  invoice: InvoiceForPdf;
  company: CompanyInfo;
}) {
  const rows = padRows(invoice.lineItems);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.clientBlock}>
            <Text style={styles.clientName}>
              {invoice.clientName}    {invoice.clientHonorific}
            </Text>
          </View>
          <View style={styles.rightBlock}>
            <View style={styles.invoiceTitleBox}>
              <Text style={styles.invoiceTitleText}>ご請求書</Text>
            </View>
            <View style={styles.issueDateRow}>
              <Text style={styles.issueDateLabel}>発行日：</Text>
              <Text>
                {(() => {
                  const d = new Date(invoice.issueDate);
                  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
                })()}
              </Text>
            </View>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.smallText}>{company.address}</Text>
            <Text style={styles.smallText}>電話：{company.tel}</Text>
          </View>
        </View>

        <Text style={styles.intro}>下記の通り、ご請求申し上げます。</Text>

        <View style={styles.summaryBoxes}>
          <View style={[styles.summaryCell, { marginRight: 8 }]}>
            <Text style={styles.summaryLabel}>ご請求金額</Text>
            <Text style={styles.summaryValue}>
              {yen(invoice.amountInclTax)} -
            </Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>支払期日</Text>
            <Text style={styles.summaryValue}>
              {invoice.dueDate.replaceAll("-", "/")}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colNo]}>No.</Text>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>案件名</Text>
            <Text style={[styles.tableHeaderCell, styles.colDate]}>納品日</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnit]}>単価</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>数量</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount, { borderRightWidth: 0 }]}>
              金額
            </Text>
          </View>
          {rows.map((row, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colNo]}>
                {row.description ? i + 1 : ""}
              </Text>
              <Text style={[styles.tableCell, styles.colDesc]}>
                {row.description}
              </Text>
              <Text style={[styles.tableCell, styles.colDate]}>
                {row.deliveryDate ?? ""}
              </Text>
              <Text style={[styles.tableCell, styles.colUnit]}>
                {row.description ? row.unitPrice.toLocaleString() : ""}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>
                {row.description ? row.quantity : ""}
              </Text>
              <Text style={[styles.tableCell, styles.colAmount, { borderRightWidth: 0 }]}>
                {row.description ? row.subtotal.toLocaleString() : "0"}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsTable}>
          <View style={styles.totalsBlock}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>小  計</Text>
              <Text style={styles.totalValue}>
                {invoice.amountExclTax.toLocaleString()}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>消 費 税</Text>
              <Text style={styles.totalValue}>
                {invoice.taxAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>合  計</Text>
              <Text style={styles.totalValue}>
                {invoice.amountInclTax.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bankBlock}>
          <Text style={styles.bankTitle}>【お振込先】</Text>
          {company.bankInfo.split("\n").map((line, i) => (
            <Text key={i} style={styles.bankLine}>
              {line}
            </Text>
          ))}
          {company.invoiceNumber ? (
            <Text style={styles.invoiceRegistration}>
              インボイス登録番号：{company.invoiceNumber}
            </Text>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}

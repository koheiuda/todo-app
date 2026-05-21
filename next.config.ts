import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 会計の請求書PDF発行APIは @react-pdf/renderer + ローカルフォントを使うため、
  // Vercel の関数バンドルに public/fonts を含める。
  outputFileTracingIncludes: {
    "/api/accounting/invoices/[id]/issue": ["./public/fonts/**/*"],
  },
};

export default nextConfig;

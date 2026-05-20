import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TodoProvider } from "@/components/todo/todo-context";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "ToDo + SEO News X",
  description: "ToDo管理とSEOニュース自動投稿の統合アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-100 text-gray-900">
        <TodoProvider>
          <Header />
          <div className="flex-1 flex gap-5 p-5 max-w-6xl mx-auto w-full">
            <Sidebar />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
          <Toaster richColors position="top-right" />
        </TodoProvider>
      </body>
    </html>
  );
}

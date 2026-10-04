import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Học Từ Vựng Tiếng Anh - Life Stories",
  description: "Ứng dụng học từ vựng tiếng Anh từ tài liệu Life Stories, chạy hoàn toàn local",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}

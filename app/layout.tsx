import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SNS Growth Rank",
  description: "Wikipedia / Google Trends の急上昇を自動更新（GitHub Pages + Actions）",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-hero">
        {children}
      </body>
    </html>
  );
}

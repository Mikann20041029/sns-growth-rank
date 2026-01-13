import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SNS Growth Rank",
  description: "SNSの成長率をランキング化",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="topbar">
          <nav className="nav">
            <Link className="brand" href="/">SNS Growth Rank</Link>
            <Link className="pill" href="/input">✍️ 入力</Link>
            <Link className="pill" href="/rank?range=1d">⚡ 1日</Link>
            <Link className="pill" href="/rank?range=3d">🔥 3日</Link>
            <Link className="pill" href="/rank?range=7d">🏆 週間</Link>
          </nav>
        </header>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}



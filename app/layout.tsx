import "./globals.css";

export const metadata = {
  title: "SNS Growth Rank",
  description: "SNS Growth Rank",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <div className="shell">
          <aside className="adRail adRailLeft">
            <div className="adBox">AD (Left)</div>
          </aside>

          <main className="content">{children}</main>

          <aside className="adRail adRailRight">
            <div className="adBox">AD (Right)</div>
          </aside>
        </div>

        <div className="adBottom">
          <div className="adBottomInner">AD (Bottom)</div>
        </div>
      </body>
    </html>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, background: "#0b0b0f", color: "#fff" }}>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          
          {/* PC左広告 */}
          <aside className="pc-ad" style={{ width: 160, padding: 8 }}>
            <div className="ad-box">AD</div>
          </aside>

          {/* メイン */}
          <main style={{ flex: 1, padding: 16 }}>
            {children}
          </main>

          {/* PC右広告 */}
          <aside className="pc-ad" style={{ width: 160, padding: 8 }}>
            <div className="ad-box">AD</div>
          </aside>
        </div>

        {/* スマホ下広告 */}
        <div className="mobile-ad">
          AD
        </div>
      </body>
    </html>
  );
}

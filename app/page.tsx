export const dynamic = "force-dynamic";

type TopItem = {
  title: string;
  views: number;
  rank: number;
  url: string;
};

async function getTop(): Promise<{ date_utc: string; items: TopItem[] }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/wiki/top`, {
    cache: "no-store",
  });

  // 本番(Vercel)ではNEXT_PUBLIC_BASE_URLが空でも相対で動くのでfallback
  if (!res.ok) {
    const res2 = await fetch("/api/wiki/top", { cache: "no-store" });
    if (!res2.ok) throw new Error("Failed to load wiki top");
    return res2.json();
  }
  return res.json();
}

export default async function Home() {
  const data = await getTop();

  return (
    <main className="wiki-bg" style={{ minHeight: "100vh", padding: 18 }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <header style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontSize: 22, color: "white" }}>今日の急上昇ネタ（Wikipedia）</h1>
            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
              データ日付(UTC): {data.date_utc}
            </span>
          </div>
          <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
            上位10件をそのまま表示。共有しやすい“ネタ拾い”用。
          </p>
        </header>

        <section style={{ display: "grid", gap: 10 }}>
          {data.items.map((it) => (
            <a
              key={it.rank}
              href={it.url}
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: "none",
                borderRadius: 14,
                padding: 14,
                background: "rgba(0,0,0,0.45)",
                border: "1px solid rgba(255,255,255,0.10)",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.10)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  {it.rank}
                </div>
                <div>
                  <div style={{ color: "white", fontSize: 15, fontWeight: 650, lineHeight: 1.25 }}>
                    {it.title}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 6 }}>
                    閲覧数: {it.views.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, whiteSpace: "nowrap" }}>
                Wikipedia →
              </div>
            </a>
          ))}
        </section>

        <footer style={{ marginTop: 18, color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
          次の拡張：共有ボタン（X/LINE）・「今日は何の日」タブ・通知
        </footer>
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";

type WikiItem = {
  title: string;
  views: number;
  rank: number;
  url: string;
};

type TrendItem = {
  title: string;
  url: string;
};

async function getWikiTop(): Promise<{ date: string; lang: string; items: WikiItem[] }> {
  const res = await fetch("/api/wiki/top", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch /api/wiki/top");
  }
  return res.json();
}

async function getGoogleTrends(): Promise<TrendItem[]> {
  const res = await fetch("/api/trends/google", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items ?? [];
}

export default async function RankPage() {
  let wiki: { date: string; lang: string; items: WikiItem[] } | null = null;
  let wikiError: string | null = null;

  let trends: TrendItem[] = [];
  let trendsError: string | null = null;

  try {
    wiki = await getWikiTop();
  } catch (e: any) {
    wikiError = e?.message ?? "API error";
  }

  try {
    trends = await getGoogleTrends();
  } catch (e: any) {
    trendsError = e?.message ?? "API error";
  }

  const items = wiki?.items ?? [];

  return (
    <main style={{ padding: 18, maxWidth: 860, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
        Wikipedia 莉頑律縺ｮ諤･荳頑・・域律譛ｬ・・
      </h1>

      <div style={{ opacity: 0.75, marginBottom: 12 }}>
        蜿門ｾ怜・: <code>/api/wiki/top</code>
        {wiki?.date ? (
          <>
            {" "}
            | 譌･莉・ <b>{wiki.date}</b>
          </>
        ) : null}
      </div>

      {wikiError ? (
        <div
          style={{
            padding: 10,
            borderRadius: 10,
            background: "rgba(255,0,0,0.08)",
            border: "1px solid rgba(255,0,0,0.18)",
            marginBottom: 12,
          }}
        >
          繧ｨ繝ｩ繝ｼ: {wikiError}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((it) => (
          <a
            key={it.rank}
            href={it.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr 120px",
              gap: 10,
              alignItems: "center",
              padding: 12,
              borderRadius: 14,
              background: "rgba(0,0,0,0.78)",
              border: "1px solid rgba(255,255,255,0.12)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.10)",
                fontWeight: 800,
              }}
            >
              {it.rank}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {it.title}
              </div>
              <div style={{ opacity: 0.6, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {it.url}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ opacity: 0.6, fontSize: 12 }}>Views</div>
              <div style={{ fontWeight: 900 }}>{it.views.toLocaleString()}</div>
            </div>
          </a>
        ))}
      </div>

      <h2 style={{ marginTop: 28, fontSize: 18, fontWeight: 900 }}>
        Google Trends・域･荳頑・・・
      </h2>

      <div style={{ opacity: 0.75, marginBottom: 10 }}>
        蜿門ｾ怜・: <code>/api/trends/google</code>
      </div>

      {trendsError ? (
        <div
          style={{
            padding: 10,
            borderRadius: 10,
            background: "rgba(255,0,0,0.08)",
            border: "1px solid rgba(255,0,0,0.18)",
            marginBottom: 12,
          }}
        >
          繧ｨ繝ｩ繝ｼ: {trendsError}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 10 }}>
        {trends.map((it, i) => (
          <a
            key={i}
            href={it.url}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: 12,
              borderRadius: 14,
              background: "rgba(0,0,0,0.78)",
              border: "1px solid rgba(255,255,255,0.12)",
              textDecoration: "none",
              color: "inherit",
              fontWeight: 800,
            }}
          >
            {i + 1}. {it.title}
          </a>
        ))}
      </div>
    </main>
  );
}

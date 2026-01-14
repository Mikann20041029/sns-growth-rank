"use client";

import { useEffect, useState } from "react";

type WikiItem = {
  title: string;
  views: number;
  rank: number;
  url: string;
};

export default function RankPage() {
  const [items, setItems] = useState<WikiItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/wiki/top", { cache: "no-store" });
        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data = await res.json();
        if (alive) setItems(data.items ?? []);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Unknown error");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <main style={{ padding: 18 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>
        Wikipedia 今日の急上昇（日本）
      </h1>

      <div style={{ opacity: 0.7, marginBottom: 12 }}>
        取得元: /api/wiki/top
      </div>

      {loading && <div>読み込み中...</div>}

      {error && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #fecaca",
            background: "#fff5f5",
            color: "#991b1b",
            marginBottom: 12,
          }}
        >
          エラー: {error}
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((it) => (
          <a
            key={it.rank}
            href={it.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 12,
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              textDecoration: "none",
              color: "#111",
              background: "#fff",
            }}
          >
            <span>
              {it.rank}. {it.title}
            </span>
            <span style={{ opacity: 0.6 }}>{it.views.toLocaleString()}</span>
          </a>
        ))}
      </div>
    </main>
  );
}

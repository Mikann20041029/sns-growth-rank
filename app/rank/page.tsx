"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type RangeKey = "1d" | "3d" | "7d";
const daysOf = (r: RangeKey) => (r === "1d" ? 1 : r === "3d" ? 3 : 7);

export default function RankPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const range = (sp.get("range") as RangeKey) || "1d";
  const days = daysOf(range);

  const [rows, setRows] = useState<{ date: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const setRange = (r: RangeKey) => router.push(`/rank?range=${r}`);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("metrics")
        .select("date,value")
        .eq("platform", "youtube")
        .eq("metric", "views")
        .order("date", { ascending: false })
        .limit(120);

      if (error) {
        setRows([]);
        setLoading(false);
        return;
      }
      setRows((data || []).map((d: any) => ({ date: d.date, value: Number(d.value) })));
      setLoading(false);
    })();
  }, [range]);

  const result = useMemo(() => {
    if (!rows.length) return null;
    const now = rows.slice(0, days).reduce((a, b) => a + b.value, 0);
    const prev = rows.slice(days, days * 2).reduce((a, b) => a + b.value, 0);
    const delta = now - prev;
    const rate = ((now - prev) / Math.max(prev, 1)) * 100;
    return { now, prev, delta, rate };
  }, [rows, days]);

  return (
    <main style={{ padding: 16, maxWidth: 720 }}>
      <h1>成長率（YouTube）</h1>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => setRange("1d")} aria-pressed={range === "1d"}>1日</button>
        <button onClick={() => setRange("3d")} aria-pressed={range === "3d"}>3日</button>
        <button onClick={() => setRange("7d")} aria-pressed={range === "7d"}>週間</button>
      </div>

      <div style={{ height: 16 }} />

      {loading && <p>読み込み中…</p>}
      {!loading && !result && <p>データがない。/input で入れて。</p>}

      {!loading && result && (
        <div>
          <p>今期合計: {result.now.toLocaleString()}</p>
          <p>前期合計: {result.prev.toLocaleString()}</p>
          <p>増分: {result.delta.toLocaleString()}</p>
          <p>成長率: {result.rate.toFixed(2)}%</p>
        </div>
      )}
    </main>
  );
}

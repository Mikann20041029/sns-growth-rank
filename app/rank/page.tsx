"use client";

import { useEffect, useMemo, useState } from "react";
import { AdSenseHead, AdSlot, SLOTS } from "../components/AdSense";

type WikiItem = { title: string; url: string; views: number };
type TrendsItem = { title: string; url: string; views?: number };

type WikiPayload = {
  ok: boolean;
  source: string;
  lang: string;
  updatedAt: string;
  items: WikiItem[];
  error?: string;
};

type TrendsPayload = {
  ok: boolean;
  source: string;
  lang: string;
  updatedAt: string;
  items: TrendsItem[];
  error?: string;
};

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch failed ${res.status}: ${path}`);
  return res.json();
}

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

export default function RankPage() {
  const [tab, setTab] = useState<"wiki" | "trends">("wiki");
  const [wiki, setWiki] = useState<WikiPayload | null>(null);
  const [trends, setTrends] = useState<TrendsPayload | null>(null);
  const [err, setErr] = useState<string>("");

  const themeClass = useMemo(() => (tab === "wiki" ? "themeWiki" : "themeTrends"), [tab]);

  useEffect(() => {
    // 最初にWIKIを読み込む
    (async () => {
      try {
        setErr("");
        const data = await fetchJson<WikiPayload>("./data/wiki.json");
        setWiki(data);
      } catch (e: any) {
        setErr(String(e?.message ?? e));
      }
    })();
  }, []);

  useEffect(() => {
    // Trendsタブを開いたときだけ読み込む（無駄アクセス減らす）
    if (tab !== "trends" || trends) return;
    (async () => {
      try {
        setErr("");
        const data = await fetchJson<TrendsPayload>("./data/trends_google.json");
        setTrends(data);
      } catch (e: any) {
        setErr(String(e?.message ?? e));
      }
    })();
  }, [tab, trends]);

  const updatedAt =
    tab === "wiki"
      ? wiki?.updatedAt ?? ""
      : trends?.updatedAt ?? "";

  const list = tab === "wiki" ? (wiki?.items ?? []) : (trends?.items ?? []);
  const serverError =
    tab === "wiki"
      ? (wiki && !wiki.ok ? wiki.error : "")
      : (trends && !trends.ok ? trends.error : "");

  return (
    <div className={`container ${themeClass}`}>
      <AdSenseHead />

      <div className="brand">
        <div>
          <h1>SNS Growth Rank</h1>
          <div className="subtitle">請求ゼロ（GitHub Pages + GitHub Actions）</div>
        </div>
        <div className="badge">
          updated: {updatedAt ? new Date(updatedAt).toISOString() : "-"}
        </div>
      </div>

      <div className="tabs">
        <button className={`tabBtn ${tab === "wiki" ? "active" : ""}`} onClick={() => setTab("wiki")}>
          Wikipedia 急上昇
        </button>
        <button className={`tabBtn ${tab === "trends" ? "active" : ""}`} onClick={() => setTab("trends")}>
          Google Trends
        </button>
      </div>

      {/* 広告（上 + 右） */}
      <div className="adGrid">
        <AdSlot slot={SLOTS.top} />
        <AdSlot slot={SLOTS.side} />
      </div>

      {(err || serverError) && (
        <div className="errorBox">
          error: {serverError || err}
        </div>
      )}

      <div className="panel">
        <div className="panelHeader">
          <div className="meta">{tab === "wiki" ? "ja / Wikipedia" : "ja / Google"}</div>
          <div className="updated">{updatedAt ? new Date(updatedAt).toLocaleString() : "-"}</div>
        </div>

        {list.map((it: any, i: number) => {
          const title = it.title ?? "(no title)";
          const url = it.url ?? "";
          const views = typeof it.views === "number" ? it.views : 0;

          return (
            <div className="row" key={`${i}-${url}`}>
              <div className="rank">#{i + 1}</div>

              <div>
                <div className="title">{title}</div>
                <div className="url">{url}</div>
              </div>

              <div className="metric">
                {tab === "wiki" ? (
                  <>
                    {fmt(views)} <small>views</small>
                  </>
                ) : (
                  <>
                    {fmt(views)} <small>views</small>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

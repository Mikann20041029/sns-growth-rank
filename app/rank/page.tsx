"use client";

import React, { useEffect, useMemo, useState } from "react";

type WikiItem = { title: string; url: string; views: number };
type TrendsItem = { title: string; url: string; source?: string };

type WikiJson = {
  ok: boolean;
  source: string;
  lang: string;
  updatedAt: string;
  items: WikiItem[];
  error?: string;
};

type TrendsJson = {
  ok: boolean;
  source: string;
  geo: string;
  lang: string;
  updatedAt: string;
  items: TrendsItem[];
  error?: string;
};

type TabKey = "wiki" | "trends";

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yy}-${mm}-${dd} ${hh}:${mi}`;
}

function nfmt(n: number) {
  try {
    return new Intl.NumberFormat("en-US").format(n);
  } catch {
    return String(n);
  }
}

function ErrorBox({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="card p-4 border-red-500/30 bg-red-500/10">
      <div className="text-sm font-semibold text-red-200">{title}</div>
      {detail ? (
        <div className="mt-2 text-xs text-red-100/80 break-all">{detail}</div>
      ) : null}
      <div className="mt-3 text-xs text-red-100/70">
        ※ これは「あなたのサイトが壊れた」じゃなくて、取得元（Google側）が弾く/仕様変える/一時ブロックの可能性が多い。表示は前回の保存データがあればそれを使うのが安定。
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="card overflow-hidden">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="border-b border-white/5 p-4">
          <div className="h-4 w-2/3 rounded bg-white/10" />
          <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  const [tab, setTab] = useState<TabKey>("wiki");

  const [wiki, setWiki] = useState<WikiJson | null>(null);
  const [trends, setTrends] = useState<TrendsJson | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<{ title: string; detail?: string } | null>(null);

  const activeData = useMemo(() => {
    return tab === "wiki" ? wiki : trends;
  }, [tab, wiki, trends]);

  const activeUpdatedAt = useMemo(() => {
    return (activeData as any)?.updatedAt as string | undefined;
  }, [activeData]);

  async function load(tabKey: TabKey) {
    setLoading(true);
    setErr(null);

    try {
      const url = tabKey === "wiki" ? "./data/wiki.json" : "./data/trends_google.json";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
      const json = await res.json();

      if (tabKey === "wiki") setWiki(json as WikiJson);
      else setTrends(json as TrendsJson);

      if (json?.ok === false) {
        setErr({ title: "データ取得に失敗（保存データ）", detail: json?.error });
      }
    } catch (e: any) {
      setErr({ title: "読み込みエラー", detail: String(e?.message ?? e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // 初回読み込み（wiki）
    load("wiki");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // タブ切り替えで読み込み
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 pill">
            <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
            GitHub Pages + Actions
          </div>

          <h1 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
            SNS Growth Rank
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            Wikipedia / Google Trends の急上昇を自動更新して一覧化
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              className={`btn ${tab === "wiki" ? "btn-active" : ""}`}
              onClick={() => setTab("wiki")}
            >
              Wikipedia 急上昇
            </button>
            <button
              className={`btn ${tab === "trends" ? "btn-active" : ""}`}
              onClick={() => setTab("trends")}
            >
              Google Trends
            </button>

            <span className="pill mono">
              updated: {formatDate(activeUpdatedAt)}
            </span>

            {loading ? <span className="pill">loading…</span> : null}
          </div>
        </div>

        <div className="card p-4 md:w-[360px]">
          <div className="text-xs text-slate-300">公開URL</div>
          <div className="mt-1 text-sm break-all">
            <a
              className="text-sky-300 hover:text-sky-200 underline underline-offset-4"
              href="./"
              target="_blank"
              rel="noreferrer"
            >
              {typeof window !== "undefined" ? window.location.href : ""}
            </a>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            ※ 見た目は今から改善していく前提でOK。まず「動く」が勝ち。
          </div>
        </div>
      </header>

      <section className="mt-8">
        {err ? <ErrorBox title={err.title} detail={err.detail} /> : null}

        {loading && !activeData ? <SkeletonList /> : null}

        {!loading && activeData && tab === "wiki" ? (
          <WikiTable data={activeData as WikiJson} />
        ) : null}

        {!loading && activeData && tab === "trends" ? (
          <TrendsTable data={activeData as TrendsJson} />
        ) : null}

        {!loading && !activeData ? (
          <div className="card p-6 text-sm text-slate-300">no data</div>
        ) : null}
      </section>

      <footer className="mt-10 text-xs text-slate-500">
        <div>© SNS Growth Rank</div>
      </footer>
    </main>
  );
}

function WikiTable({ data }: { data: WikiJson }) {
  const items = Array.isArray(data?.items) ? data.items : [];

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <div className="text-sm font-semibold">Wikipedia</div>
        <div className="pill mono">{data?.lang ?? "—"} / {formatDate(data?.updatedAt)}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr className="text-left text-xs text-slate-300">
              <th className="px-5 py-3 w-[72px]">#</th>
              <th className="px-5 py-3">title</th>
              <th className="px-5 py-3 w-[160px] text-right">views</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} className="border-t border-white/5 hover:bg-white/5 transition">
                <td className="px-5 py-4 text-sm text-slate-300 mono">#{idx + 1}</td>
                <td className="px-5 py-4">
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-100 hover:text-sky-200 underline underline-offset-4"
                  >
                    {it.title}
                  </a>
                  <div className="mt-1 text-xs text-slate-500 break-all">{it.url}</div>
                </td>
                <td className="px-5 py-4 text-right mono text-sm">
                  {nfmt(Number(it.views ?? 0))}
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-sm text-slate-300" colSpan={3}>
                  items が空
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrendsTable({ data }: { data: TrendsJson }) {
  const items = Array.isArray(data?.items) ? data.items : [];

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <div className="text-sm font-semibold">Google Trends</div>
        <div className="pill mono">{data?.lang ?? "—"} / {formatDate(data?.updatedAt)}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr className="text-left text-xs text-slate-300">
              <th className="px-5 py-3 w-[72px]">#</th>
              <th className="px-5 py-3">topic</th>
              <th className="px-5 py-3 w-[140px] text-right">views</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} className="border-t border-white/5 hover:bg-white/5 transition">
                <td className="px-5 py-4 text-sm text-slate-300 mono">#{idx + 1}</td>
                <td className="px-5 py-4">
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-100 hover:text-sky-200 underline underline-offset-4"
                  >
                    {it.title}
                  </a>
                  <div className="mt-1 text-xs text-slate-500 break-all">{it.url}</div>
                </td>
                <td className="px-5 py-4 text-right mono text-sm">
                  0
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-sm text-slate-300" colSpan={3}>
                  items が空
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

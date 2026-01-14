import fs from "fs";

const OUT_PATH = "docs/data/trends_reddit.json";

// まずは一番安定の r/all hot（日次トレンド寄り）
const URL = "https://www.reddit.com/r/all/hot.json?limit=50&t=day&raw_json=1";

async function j(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "sns-growth-rank/1.0 (by u/placeholder)",
      "Accept": "application/json",
    }
  });
  if (!res.ok) throw new Error(`fetch failed ${res.status}: ${url}`);
  return await res.json();
}

(async () => {
  try {
    const data = await j(URL);
    const children = data?.data?.children ?? [];

    const items = children.map((c) => {
      const p = c?.data ?? {};
      const permalink = p?.permalink ? `https://www.reddit.com${p.permalink}` : "";
      const url = (p?.url_overridden_by_dest ?? p?.url ?? permalink);
      return {
        id: p?.id ?? "",
        title: p?.title ?? "",
        url,
        permalink,
        subreddit: p?.subreddit ?? "",
        score: p?.score ?? 0,
        comments: p?.num_comments ?? 0,
        author: p?.author ?? "",
        createdAt: p?.created_utc ? new Date(p.created_utc * 1000).toISOString() : null,
      };
    }).filter(x => x.title && x.url);

    const out = {
      ok: true,
      source: "reddit_r_all_hot",
      geo: "GLOBAL",
      lang: "en",
      updatedAt: new Date().toISOString(),
      items,
    };

    fs.mkdirSync("docs/data", { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf-8");
    console.log(`updated ${OUT_PATH}: ${items.length}`);
  } catch (e) {
    const out = {
      ok: false,
      source: "reddit_r_all_hot",
      geo: "GLOBAL",
      lang: "en",
      updatedAt: new Date().toISOString(),
      error: String(e?.message ?? e),
      items: [],
    };
    fs.mkdirSync("docs/data", { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf-8");
    console.log(`failed ${OUT_PATH}: ${out.error}`);
    process.exitCode = 1;
  }
})();


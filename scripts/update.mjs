import fs from "node:fs";
import path from "node:path";

const outDir = path.join(process.cwd(), "docs", "data");
fs.mkdirSync(outDir, { recursive: true });

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "user-agent": "sns-growth-rank-bot" } });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  return await res.json();
}

async function main() {
  const d = new Date(Date.now() - 24 * 3600 * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");

  const api = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/ja.wikipedia/all-access/${yyyy}/${mm}/${dd}`;
  const raw = await fetchJson(api);

  const items = (raw?.items?.[0]?.articles ?? [])
    .slice(0, 50)
    .map((a, i) => ({
      rank: i + 1,
      title: a.article,
      views: a.views,
      url: `https://ja.wikipedia.org/wiki/${encodeURIComponent(a.article)}`,
    }));

  const out = {
    ok: true,
    date: `${yyyy}-${mm}-${dd}`,
    lang: "ja",
    items,
  };

  fs.writeFileSync(path.join(outDir, "wiki.json"), JSON.stringify(out, null, 2), "utf-8");
  console.log("updated docs/data/wiki.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

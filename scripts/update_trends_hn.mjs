import fs from "fs";

const OUT_PATH = "docs/data/trends_hn.json";
const TOP_URL = "https://hacker-news.firebaseio.com/v0/topstories.json";
const ITEM_URL = (id) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;

const pick = (x, n) => x.slice(0, n);

async function j(url) {
  const res = await fetch(url, { headers: { "User-Agent": "sns-growth-rank/1.0" }});
  if (!res.ok) throw new Error(`fetch failed ${res.status}: ${url}`);
  return await res.json();
}

(async () => {
  try {
    const ids = await j(TOP_URL);
    const top = pick(ids, 50);

    const itemsRaw = await Promise.all(top.map(async (id) => {
      const it = await j(ITEM_URL(id));
      return {
        id: it?.id,
        title: it?.title ?? "",
        url: it?.url ?? `https://news.ycombinator.com/item?id=${id}`,
        score: it?.score ?? 0,
        comments: it?.descendants ?? 0,
        by: it?.by ?? "",
        time: it?.time ? new Date(it.time * 1000).toISOString() : null,
        hn: `https://news.ycombinator.com/item?id=${id}`,
      };
    }));

    const items = itemsRaw.filter(x => x && x.title && x.url);

    const out = {
      ok: true,
      source: "hacker_news_top",
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
      source: "hacker_news_top",
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

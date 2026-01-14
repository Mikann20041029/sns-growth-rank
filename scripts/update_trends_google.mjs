/**
 * Google Trends (RSS) -> docs/data/trends_google.json
 * GitHub Pages用：静的JSONを生成して docs/ に置く
 */
import fs from "node:fs";
import path from "node:path";

const GEO = "JP";
// ★ ここが重要：daily/rss が 404 になる環境があるので、"trending/rss" を使う
const RSS_URL = `https://trends.google.com/trending/rss?geo=${GEO}`;

function toISODate(d = new Date()) {
  // YYYY-MM-DD
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function decodeXmlEntities(s) {
  return s
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function pickTag(block, tagName) {
  // tagName 例: "title", "link", "ht:approx_traffic"
  const re = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const m = block.match(re);
  return m ? decodeXmlEntities(m[1].trim()) : "";
}

function stripCdata(s) {
  // <![CDATA[ ... ]]>
  return s.replace(/^<!\[CDATA\[(.*)\]\]>$/s, "$1").trim();
}

function trafficToViews(traffic) {
  // 例: "200K+", "50K+", "1M+"
  const t = traffic.replaceAll(",", "").trim();
  const m = t.match(/([\d.]+)\s*([KM])?\+?/i);
  if (!m) return null;
  const num = Number(m[1]);
  if (Number.isNaN(num)) return null;
  const suf = (m[2] || "").toUpperCase();
  if (suf === "K") return Math.round(num * 1000);
  if (suf === "M") return Math.round(num * 1000 * 1000);
  return Math.round(num);
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      // Google系はUA無しだと弾かれることがある
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "accept": "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.1",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`fetch failed ${res.status}: ${url}`);
  }
  return await res.text();
}

function decodeTrendingRss(xml) {
  // <item>...</item> を抜いて title/link/traffic を拾う
  const items = [];
  const reItem = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = reItem.exec(xml)) !== null) {
    const blockRaw = m[1];

    const title = stripCdata(pickTag(blockRaw, "title"));
    const link = stripCdata(pickTag(blockRaw, "link"));

    // trafficタグは ht:approx_traffic のことが多い（無い場合もある）
    const trafficRaw =
      stripCdata(pickTag(blockRaw, "ht:approx_traffic")) ||
      stripCdata(pickTag(blockRaw, "approx_traffic")) ||
      "";

    const views = trafficRaw ? trafficToViews(trafficRaw) : null;

    if (!title) continue;

    items.push({
      title,
      url: link || "",
      traffic: trafficRaw || "",
      views: views ?? 0,
    });
  }

  // 0件のときは、HTMLが返ってきてる可能性が高い
  if (items.length === 0) {
    throw new Error("no items parsed (RSS format changed or blocked)");
  }

  return items;
}

async function main() {
  const xml = await fetchText(RSS_URL);
  const parsed = decodeTrendingRss(xml);

  // viewsの大きい順（traffic取れないものは0）
  parsed.sort((a, b) => (b.views || 0) - (a.views || 0));

  const items = parsed.slice(0, 50).map((x, i) => ({
    rank: i + 1,
    title: x.title,
    views: x.views,
    url: x.url,
    traffic: x.traffic,
  }));

  const out = {
    ok: true,
    date: toISODate(),
    source: "google_trends_rss",
    geo: GEO,
    updatedAt: new Date().toISOString(),
    items,
  };

  const outDir = path.join("docs", "data");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "trends_google.json"),
    JSON.stringify(out, null, 2),
    "utf-8"
  );

  console.log(`updated docs/data/trends_google.json : ${items.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import fs from "node:fs";

const OUT_PATH = "docs/data/trends_google.json";

// まず .com のRSSだけを複数パターンで試す（co.jp はやめる）
const RSS_URLS = [
  "https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP&hl=ja&tz=-540",
  "https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP&hl=ja",
  "https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP",
  "https://trends.google.com/trends/trendingsearches/daily/rss?hl=ja",
  "https://trends.google.com/trends/trendingsearches/daily/rss",
];

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
      "accept-language": "ja,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`fetch failed ${res.status}: ${url}`);
  return await res.text();
}

function pickTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function decodeGoogleTrendsRss(xml) {
  const items = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

  for (const b of blocks) {
    const title = pickTag(b, "title");
    const link = pickTag(b, "link");
    const traffic =
      pickTag(b, "ht:approx_traffic") ||
      pickTag(b, "approx_traffic") ||
      pickTag(b, "ht:traffic") ||
      "";

    let views = null;
    if (traffic) {
      const t = traffic.replace(/,/g, "").toUpperCase();
      const m = t.match(/^(\d+(?:\.\d+)?)([KM])?\+?$/);
      if (m) {
        const n = Number(m[1]);
        const unit = m[2];
        views =
          unit === "M" ? Math.round(n * 1_000_000) :
          unit === "K" ? Math.round(n * 1_000) :
          Math.round(n);
      }
    }

    if (!title) continue;
    items.push({ title, views, url: link || "" });
  }

  items.sort((a, b) => (b.views ?? -1) - (a.views ?? -1));
  return items.slice(0, 50).map((x, i) => ({ rank: i + 1, ...x }));
}

function safeReadExisting() {
  try {
    if (!fs.existsSync(OUT_PATH)) return null;
    const raw = fs.readFileSync(OUT_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

(async () => {
  const prev = safeReadExisting();

  let xml = null;
  let used = null;
  let lastErr = null;

  for (const url of RSS_URLS) {
    try {
      xml = await fetchText(url);
      used = url;
      break;
    } catch (e) {
      lastErr = e;
    }
  }

  // 取得できないなら「前の成功データを残して」終了（←ここが重要）
  if (!xml) {
    const msg = String(lastErr?.message ?? lastErr ?? "all RSS urls failed");
    console.log(`trends fetch failed, keep previous file: ${msg}`);
    if (prev && prev.ok === true) process.exit(0);

    // 初回で何も無い場合だけ ok:false を作る
    const out = {
      ok: false,
      source: "google_trends_rss",
      geo: "JP",
      lang: "ja",
      updatedAt: new Date().toISOString(),
      error: msg,
      items: [],
    };
    fs.mkdirSync("docs/data", { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf-8");
    process.exit(0);
  }

  const items = decodeGoogleTrendsRss(xml);
  const out = {
    ok: true,
    source: "google_trends_rss",
    geo: "JP",
    lang: "ja",
    updatedAt: new Date().toISOString(),
    rss: used,
    items,
  };

  fs.mkdirSync("docs/data", { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf-8");
  console.log(`updated ${OUT_PATH}: ${items.length}`);
})();

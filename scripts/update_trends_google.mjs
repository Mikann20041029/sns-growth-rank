import fs from "node:fs";

const OUT_PATH = "docs/data/trends_google.json";

// Google Trends RSS は geo=JP が404になることがあるので、複数URLを順に試す
const RSS_URLS = [
  // JP指定（通る時もある）
  "https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP",
  // geo指定なし（こっちが通りやすいことが多い）
  "https://trends.google.com/trends/trendingsearches/daily/rss",
  // フォールバック（言語だけ）
  "https://trends.google.com/trends/trendingsearches/daily/rss?hl=ja",
];

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`fetch failed ${res.status}: ${url}`);
  return await res.text();
}

function pickTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function decodeGoogleTrendsRss(xml) {
  // 超雑でも動くRSSパーサ（1 item = 1トレンド）
  const items = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

  for (const b of blocks) {
    const title = pickTag(b, "title");
    const link = pickTag(b, "link");
    const traffic = pickTag(b, "ht:approx_traffic") || pickTag(b, "approx_traffic");

    // "200K+" みたいなのを数値っぽく整形（失敗したらnull）
    let views = null;
    if (traffic) {
      const t = traffic.replace(/,/g, "").toUpperCase();
      const m = t.match(/^(\d+(?:\.\d+)?)([KM])?\+?$/);
      if (m) {
        const n = Number(m[1]);
        const unit = m[2];
        views = unit === "M" ? Math.round(n * 1_000_000) : unit === "K" ? Math.round(n * 1_000) : Math.round(n);
      }
    }

    if (!title) continue;
    items.push({
      title,
      views,
      url: link || "",
    });
  }

  // views が null のものは下に回す
  items.sort((a, b) => (b.views ?? -1) - (a.views ?? -1));

  return items.slice(0, 50).map((x, i) => ({ rank: i + 1, ...x }));
}

(async () => {
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

  try {
    if (!xml) throw lastErr ?? new Error("all RSS urls failed");

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
  } catch (e) {
    const out = {
      ok: false,
      source: "google_trends_rss",
      geo: "JP",
      lang: "ja",
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

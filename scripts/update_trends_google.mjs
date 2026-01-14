import fs from "node:fs";

const OUT_PATH = "docs/data/trends_google.json";

// こいつが新しいRSS（古い daily/rss は 404）
const RSS_URLS = [
  "https://trends.google.co.jp/trending/rss?geo=JP",
  "https://trends.google.com/trending/rss?geo=JP",
  "https://trends.google.co.jp/trending/rss?geo=JP&hl=ja",
];

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
      "accept": "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      "accept-language": "ja,en;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`fetch failed ${res.status}: ${url}`);
  return await res.text();
}

// RSS(<item>) / Atom(<entry>) 両対応で雑に抜く（壊れにくい）
function decodeTrendsXml(xml) {
  const items = [];

  // 1) RSS: <item>...</item>
  const rssItems = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/g)];
  for (const m of rssItems) {
    const block = m[0];
    const title = (block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || block.match(/<title>([\s\S]*?)<\/title>/))?.[1]?.trim();
    const traffic = (block.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/) || [])[1]?.trim() ?? null;

    let link =
      (block.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/) || block.match(/<link>([\s\S]*?)<\/link>/))?.[1]?.trim() ??
      null;

    if (title) items.push({ title, traffic, link });
  }

  // 2) Atom: <entry>...</entry>
  if (items.length === 0) {
    const atomEntries = [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/g)];
    for (const m of atomEntries) {
      const block = m[0];
      const title = (block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || block.match(/<title>([\s\S]*?)<\/title>/))?.[1]?.trim();
      const traffic = (block.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/) || [])[1]?.trim() ?? null;

      // Atomは <link href="..."/>
      let link = (block.match(/<link[^>]*?href="([^"]+)"[^>]*?>/i) || [])[1]?.trim() ?? null;

      if (title) items.push({ title, traffic, link });
    }
  }

  // rank付与
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

  if (!xml) {
    const out = {
      ok: false,
      source: "google_trends_rss",
      geo: "JP",
      lang: "ja",
      updatedAt: new Date().toISOString(),
      error: String(lastErr?.message ?? lastErr ?? "all RSS urls failed"),
      items: [],
    };
    fs.mkdirSync("docs/data", { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf-8");
    console.log(`failed ${OUT_PATH}: ${out.error}`);
    process.exitCode = 0; // ← 失敗でもジョブ落とさない（サイトは動かす）
    return;
  }

  const items = decodeTrendsXml(xml);

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

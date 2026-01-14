import fs from "node:fs";
import path from "node:path";

const OUT_PATH = path.join("docs", "data", "trends_google.json");

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
      "accept": "application/xml,text/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`fetch failed ${res.status}: ${url}`);
  return await res.text();
}

function pickAll(xml, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out = [];
  let m;
  while ((m = re.exec(xml))) out.push(m[1].trim());
  return out;
}

function decodeEntities(s) {
  return s
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function parseGoogleNewsRss(xml, limit = 50) {
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  const items = [];
  let m;
  while ((m = itemRe.exec(xml)) && items.length < limit) {
    const chunk = m[1];
    const title = decodeEntities((pickAll(chunk, "title")[0] ?? "").replace(/\s+-\s+.+$/, ""));
    const link = decodeEntities(pickAll(chunk, "link")[0] ?? "");
    const pubDate = decodeEntities(pickAll(chunk, "pubDate")[0] ?? "");
    const source = decodeEntities(pickAll(chunk, "source")[0] ?? "");
    if (!title || !link) continue;
    items.push({
      rank: items.length + 1,
      title,
      url: link,
      source,
      pubDate,
    });
  }
  return items;
}

function safeReadJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

(async () => {
  // Google Trends本家RSS/JSONが404化してるので、安定する「Google News RSS」をTrends枠として使う
  const FEED = "https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja";

  const prev = safeReadJson(OUT_PATH);

  try {
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });

    const xml = await fetchText(FEED);
    const items = parseGoogleNewsRss(xml, 50);

    const out = {
      ok: true,
      source: "google_news_rss_as_trends",
      geo: "JP",
      lang: "ja",
      updatedAt: new Date().toISOString(),
      items,
    };

    fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf-8");
    console.log(`updated ${OUT_PATH}: ${items.length}`);
  } catch (e) {
    // 取れない日は「失敗JSONで上書きしない」＝前回の成功データを維持してサイトを壊さない
    console.warn(`[WARN] trends fetch failed: ${String(e?.message ?? e)}`);
    if (prev?.ok === true) {
      console.warn(`[WARN] keep previous ${OUT_PATH} (last good data)`);
      process.exit(0);
    }
    const out = {
      ok: false,
      source: "google_news_rss_as_trends",
      geo: "JP",
      lang: "ja",
      updatedAt: new Date().toISOString(),
      error: String(e?.message ?? e),
      items: [],
    };
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf-8");
    process.exit(0); // non-blocking
  }
})();

import fs from "node:fs";

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0", "accept": "application/json,text/plain,*/*" }
  });
  if (!res.ok) throw new Error(`fetch failed ${res.status}: ${url}`);
  const text = await res.text();
  // GoogleのAPIは ")]}'," みたいなゴミが先頭につくことがある
  const cleaned = text.replace(/^\)\]\}',?\s*\n?/, "");
  return JSON.parse(cleaned);
}

function pickItems(dailyTrendsJson) {
  // だいたいこの形（地域/日付で中身は変わる）
  const days = dailyTrendsJson?.default?.trendingSearchesDays ?? [];
  const firstDay = days[0] ?? {};
  const date = firstDay?.date ?? null;

  const searches = firstDay?.trendingSearches ?? [];
  const items = searches.map((s, i) => {
    const title = s?.title?.query ?? "unknown";
    const trafficStr = s?.formattedTraffic ?? ""; // "200K+" とか
    const traffic = trafficStr;
    const url = s?.shareUrl ?? null;
    return { rank: i + 1, title, traffic, url };
  });

  return { date, items };
}

const GEO = "JP";
const HL = "ja-JP";
const TZ = -540; // 日本はUTC+9 → -540

const api = `https://trends.google.com/trends/api/dailytrends?hl=${HL}&tz=${TZ}&geo=${GEO}&ns=15`;

try {
  const json = await fetchJson(api);
  const { date, items } = pickItems(json);

  const out = {
    ok: true,
    source: "google_trends_dailytrends_api",
    geo: GEO,
    lang: "ja",
    updatedAt: new Date().toISOString(),
    date,
    items: items.slice(0, 50),
  };

  fs.mkdirSync("docs/data", { recursive: true });
  fs.writeFileSync("docs/data/trends_google.json", JSON.stringify(out, null, 2), "utf-8");
  console.log("updated docs/data/trends_google.json", out.items.length);
} catch (e) {
  // 失敗してもサイト全体を壊さない用に、空のエラーJSONを吐く
  const out = {
    ok: false,
    source: "google_trends_dailytrends_api",
    geo: "JP",
    lang: "ja",
    updatedAt: new Date().toISOString(),
    error: String(e?.message ?? e),
    items: [],
  };
  fs.mkdirSync("docs/data", { recursive: true });
  fs.writeFileSync("docs/data/trends_google.json", JSON.stringify(out, null, 2), "utf-8");
  console.log("failed but wrote docs/data/trends_google.json (ok:false)");
}

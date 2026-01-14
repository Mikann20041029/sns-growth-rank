export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TrendItem = { title: string; url: string };

function cleanText(s: string) {
  return s.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim();
}

// Google Trends の RSS (日本 / 日間急上昇)
const RSS_URL = "https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP";

export async function GET() {
  try {
    const res = await fetch(RSS_URL, { cache: "no-store" });
    if (!res.ok) {
      return Response.json({ ok: false, error: `fetch failed: ${res.status}` }, { status: 500 });
    }

    const xml = await res.text();

    // 雑に <item> を拾って title/link を抜く（RSSの形が多少変わっても壊れにくい）
    const items: TrendItem[] = [];
    const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

    for (const block of itemBlocks.slice(0, 50)) {
      const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);

      const title = titleMatch ? cleanText(titleMatch[1]) : "";
      const url = linkMatch ? cleanText(linkMatch[1]) : "";

      if (title && url) items.push({ title, url });
    }

    return Response.json(
      {
        ok: true,
        source: "google-trends-rss",
        geo: "JP",
        items,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message ?? "unknown error" }, { status: 500 });
  }
}

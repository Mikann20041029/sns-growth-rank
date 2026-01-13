import { NextResponse } from "next/server";

type TopItem = {
  title: string;
  views: number;
  rank: number;
  url: string;
};

export async function GET() {
  // Wikipedia Pageviews Top API (日本語)
  // UTC日付で「前日分」が確実に出るので、昨日の日付を使う
  const now = new Date();
  const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yyyy = y.getUTCFullYear();
  const mm = String(y.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(y.getUTCDate()).padStart(2, "0");

  const endpoint = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/ja.wikipedia/all-access/${yyyy}/${mm}/${dd}`;

  const res = await fetch(endpoint, {
    headers: { "User-Agent": "sns-growth-rank (learning project)" },
    // キャッシュして負荷を減らす（同日中は同じ結果でOK）
    next: { revalidate: 60 * 60 }, // 1時間
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "failed to fetch top pageviews", status: res.status },
      { status: 500 }
    );
  }

  const data = await res.json();

  const articles = data?.items?.[0]?.articles ?? [];
  const cleaned: TopItem[] = articles
    // “Main_Page”や特殊ページを避けたいならフィルタ
    .filter((a: any) => a?.article && a.article !== "Main_Page" && !String(a.article).startsWith("Special:"))
    .slice(0, 10)
    .map((a: any, idx: number) => {
      const title = String(a.article).replaceAll("_", " ");
      const url = `https://ja.wikipedia.org/wiki/${encodeURIComponent(String(a.article))}`;
      return {
        title,
        views: Number(a.views ?? 0),
        rank: idx + 1,
        url,
      };
    });

  return NextResponse.json({
    date_utc: `${yyyy}-${mm}-${dd}`,
    items: cleaned,
  });
}

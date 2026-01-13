import { NextResponse } from "next/server";

const KEY = process.env.YOUTUBE_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET!;

function isAuthorized(req: Request) {
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${CRON_SECRET}`;
}

function todayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

async function supabaseGetVideoIds(): Promise<string[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/yt_videos?select=video_id&limit=1000`, {
    headers: {
      apikey: SUPABASE_SERVICE,
      Authorization: `Bearer ${SUPABASE_SERVICE}`,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return json.map((x: any) => x.video_id);
}

async function supabaseUpsertDaily(rows: any[]) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/yt_video_daily`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE,
      Authorization: `Bearer ${SUPABASE_SERVICE}`,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  if (!KEY) {
    return NextResponse.json({ ok: false, error: "No API key" }, { status: 500 });
  }

  const date = todayJST();
  const ids = await supabaseGetVideoIds();
  if (ids.length === 0) return NextResponse.json({ ok: true, date, saved: 0 });

  let saved = 0;

  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const url =
      `https://www.googleapis.com/youtube/v3/videos` +
      `?part=statistics&id=${encodeURIComponent(chunk.join(","))}&key=${KEY}`;

    const data = await fetch(url).then((r) => r.json());

    const rows = (data.items ?? []).map((v: any) => ({
      video_id: v.id,
      date,
      view_count: Number(v.statistics?.viewCount ?? 0),
      like_count: v.statistics?.likeCount ? Number(v.statistics.likeCount) : null,
      comment_count: v.statistics?.commentCount ? Number(v.statistics.commentCount) : null,
    }));

    await supabaseUpsertDaily(rows);
    saved += rows.length;
  }

  return NextResponse.json({ ok: true, date, saved });
}

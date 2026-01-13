import { NextResponse } from "next/server";

const KEY = process.env.YOUTUBE_API_KEY!;
const REGION = "JP";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET!;

function isAuthorized(req: Request) {
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${CRON_SECRET}`;
}

async function supabaseUpsertVideos(videos: any[]) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/yt_videos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE,
      Authorization: `Bearer ${SUPABASE_SERVICE}`,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(videos),
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

  const url =
    `https://www.googleapis.com/youtube/v3/videos` +
    `?part=snippet,statistics&chart=mostPopular&regionCode=${REGION}&maxResults=50&key=${KEY}`;

  const popular = await fetch(url).then((r) => r.json());

  const mapped = (popular.items ?? []).map((v: any) => ({
    video_id: v.id,
    title: v.snippet?.title ?? "",
    channel_id: v.snippet?.channelId ?? null,
    channel_title: v.snippet?.channelTitle ?? null,
    published_at: v.snippet?.publishedAt ?? null,
    thumbnail_url: v.snippet?.thumbnails?.medium?.url ?? null,
  }));

  await supabaseUpsertVideos(mapped);

  return NextResponse.json({ ok: true, added: mapped.length });
}

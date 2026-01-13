import Link from "next/link";

export default function Home() {
  return (
    <main className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>SNS 再生数 成長率ランキング</h1>
          <p className="small" style={{ marginTop: 8 }}>
            「昨日より伸びたやつ誰？」を秒で出す。まずはYouTube。X/Instagramも同じ仕組みで追加できる。
          </p>
        </div>
        <span className="badge">β版 / 手入力対応</span>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        <Link href="/input"><button className="btn btn-primary">✍️ データ入力</button></Link>
        <Link href="/rank?range=1d"><button className="btn">⚡ 1日ランキング</button></Link>
        <Link href="/rank?range=3d"><button className="btn">🔥 3日ランキング</button></Link>
        <Link href="/rank?range=7d"><button className="btn btn-green">🏆 週間ランキング</button></Link>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>使い方</h2>
      <ol style={{ lineHeight: 1.9, marginTop: 0 }}>
        <li><b>/input</b> で日付と再生数を入れる（目安：期間×2日分）</li>
        <li><b>/rank</b> で成長率＆順位が出る</li>
        <li>「押せるのか分からない問題」は今日で終わり（ボタン化済み）</li>
      </ol>
    </main>
  );
}


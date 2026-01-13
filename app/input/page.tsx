"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function InputPage() {
  const [platform, setPlatform] = useState<"youtube" | "x" | "instagram">("youtube");
  const [date, setDate] = useState("");
  const [value, setValue] = useState<number>(0);
  const [msg, setMsg] = useState("");

  const save = async () => {
    setMsg("");
    if (!date) return setMsg("日付を入れて");
    if (!Number.isFinite(value) || value < 0) return setMsg("数値が変");

    const { error } = await supabase.from("metrics").upsert({
      platform,
      metric: "views",
      date,
      value: Math.floor(value),
    });

    if (error) setMsg(`保存失敗: ${error.message}`);
    else setMsg("保存OK ✅");
  };

  return (
    <main className="card">
      <h1 style={{ marginTop: 0 }}>データ入力</h1>
      <p className="small">YouTube / X / Instagram の日次データを入れる。まずはYouTubeでOK。</p>

      <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <div>
          <label>Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value as any)}>
            <option value="youtube">YouTube</option>
            <option value="x">X</option>
            <option value="instagram">Instagram</option>
          </select>
        </div>

        <div>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div>
          <label>Views</label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            min={0}
            placeholder="例: 12345"
          />
        </div>

        <button className="btn btn-primary" onClick={save}>保存</button>
        <div className="small">{msg}</div>
      </div>
    </main>
  );
}


"use client";

import Script from "next/script";
import { useEffect } from "react";

// ここだけは「あなたのAdSense情報」に依存するから、既にどこかに入れてるならそのままでOK。
// 何も入ってない場合でも、枠だけ表示される（エラーで壊れない）ようにしてる。
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
const SLOT_TOP = process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ?? "";
const SLOT_SIDE = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDE ?? "";

function pushAds() {
  try {
    // @ts-ignore
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch {}
}

export function AdSenseHead() {
  if (!ADSENSE_CLIENT) return null;
  return (
    <Script
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
    />
  );
}

export function AdSlot({
  slot,
  className,
  format = "auto",
  responsive = true,
}: {
  slot: string;
  className?: string;
  format?: string;
  responsive?: boolean;
}) {
  useEffect(() => {
    pushAds();
  }, []);

  // client/slotが未設定でもUIは壊さない（枠だけ出す）
  const ready = Boolean(ADSENSE_CLIENT && slot);

  return (
    <div className={className}>
      <div className="adFrame">
        {ready ? (
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={responsive ? "true" : "false"}
          />
        ) : (
          <div className="adPlaceholder">
            ad
          </div>
        )}
      </div>
    </div>
  );
}

export const SLOTS = {
  top: SLOT_TOP,
  side: SLOT_SIDE,
};

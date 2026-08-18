"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const MIN_VISIBLE_MS = 700;
const FALLBACK_HIDE_MS = 2200;

export default function Preloader() {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const hasFinished = useRef(false);

  useEffect(() => {
    const startedAt = performance.now();
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = () => {
      if (hasFinished.current) return;
      hasFinished.current = true;

      const elapsed = performance.now() - startedAt;
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

      hideTimer = setTimeout(() => {
        setIsLeaving(true);
        hideTimer = setTimeout(() => setIsVisible(false), 420);
      }, remaining);
    };

    if (document.readyState === "complete") {
      requestAnimationFrame(finish);
    } else {
      window.addEventListener("load", finish, { once: true });
    }

    const fallbackTimer = setTimeout(finish, FALLBACK_HIDE_MS);

    return () => {
      window.removeEventListener("load", finish);
      clearTimeout(fallbackTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`app-preloader${isLeaving ? " app-preloader--leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Memuat SI PARIK BANGKA"
    >
      <div className="app-preloader__glow app-preloader__glow--one" />
      <div className="app-preloader__glow app-preloader__glow--two" />

      <div className="app-preloader__content">
        <div className="app-preloader__logo-wrap">
          <span className="app-preloader__ring app-preloader__ring--outer" />
          <span className="app-preloader__ring app-preloader__ring--inner" />
          <Image
            className="app-preloader__logo"
            src="/logo-si-parik-preloader.png"
            alt="SI PARIK BANGKA"
            width={260}
            height={260}
            priority
          />
        </div>

        <div className="app-preloader__progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}

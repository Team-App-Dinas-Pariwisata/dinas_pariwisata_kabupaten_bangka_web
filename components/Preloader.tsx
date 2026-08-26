"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const MIN_VISIBLE_MS = 700;
const FALLBACK_HIDE_MS = 2200;
const SKIP_PATH_PREFIXES = ["/dashboard", "/admin", "/akun", "/petugas", "/login"];

export default function Preloader() {
  const pathname = usePathname();
  const shouldSkip = SKIP_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const [isVisible, setIsVisible] = useState(!shouldSkip);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (shouldSkip) return;

    const startedAt = performance.now();
    let finishScheduled = false;
    let frameId: number | undefined;
    let leaveTimer: ReturnType<typeof setTimeout> | undefined;
    let removeTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = () => {
      if (finishScheduled) return;
      finishScheduled = true;

      const elapsed = performance.now() - startedAt;
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

      leaveTimer = setTimeout(() => {
        setIsLeaving(true);
        removeTimer = setTimeout(() => setIsVisible(false), 420);
      }, remaining);
    };

    if (document.readyState === "complete") {
      frameId = requestAnimationFrame(finish);
    } else {
      window.addEventListener("load", finish, { once: true });
    }

    const fallbackTimer = setTimeout(finish, FALLBACK_HIDE_MS);

    return () => {
      window.removeEventListener("load", finish);
      clearTimeout(fallbackTimer);
      if (frameId !== undefined) cancelAnimationFrame(frameId);
      if (leaveTimer) clearTimeout(leaveTimer);
      if (removeTimer) clearTimeout(removeTimer);
    };
  }, [shouldSkip]);

  if (shouldSkip || !isVisible) return null;

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

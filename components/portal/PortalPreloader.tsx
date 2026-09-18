"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const EVENT_START = "portal:loading:start";
const EVENT_STOP = "portal:loading:stop";

export function startPortalLoading(message = "Memuat…") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(EVENT_START, {
      detail: { message },
    }),
  );
}

export function stopPortalLoading() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_STOP));
}

function PortalPreloaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("Memuat halaman…");
  const [progress, setProgress] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);

  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNavigatingRef = useRef(false);

  // Clear all running timers
  const clearTimers = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const start = (customMessage?: string) => {
    clearTimers();
    setIsLeaving(false);
    setMessage(customMessage || "Memuat…");
    setActive(true);
    setProgress(20);

    // Increment progress gradually up to ~85%
    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) return prev;
        const increment = Math.max(1, (85 - prev) * 0.15);
        return Math.min(85, prev + increment);
      });
    }, 180);

    // Safety timeout: auto stop after 10s if not stopped
    autoHideTimerRef.current = setTimeout(() => {
      stop();
    }, 10000);
  };

  const stop = () => {
    clearTimers();
    setProgress(100);
    leaveTimerRef.current = setTimeout(() => {
      setIsLeaving(true);
      leaveTimerRef.current = setTimeout(() => {
        setActive(false);
        setIsLeaving(false);
        setProgress(0);
        isNavigatingRef.current = false;
      }, 250);
    }, 180);
  };

  // Event listener for manual start/stop
  useEffect(() => {
    const handleStart = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      start(detail?.message);
    };
    const handleStop = () => {
      stop();
    };

    window.addEventListener(EVENT_START, handleStart);
    window.addEventListener(EVENT_STOP, handleStop);

    return () => {
      window.removeEventListener(EVENT_START, handleStart);
      window.removeEventListener(EVENT_STOP, handleStop);
      clearTimers();
    };
  }, []);

  // When pathname or searchParams changes, finish the transition
  useEffect(() => {
    if (active || isNavigatingRef.current) {
      stop();
    }
  }, [pathname, searchParams]);

  // Click interceptor for internal navigation links
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      if (anchor.target === "_blank") return;
      if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      // Check if same origin and different URL
      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;

        const currentFull = window.location.pathname + window.location.search;
        const targetFull = url.pathname + url.search;

        if (currentFull !== targetFull) {
          isNavigatingRef.current = true;
          // Determine custom message based on destination or anchor text
          let label = "Memuat halaman…";
          const text = anchor.textContent?.trim().toLowerCase() || "";
          if (text.includes("tinjau") || text.includes("lihat")) {
            label = "Memuat detail…";
          } else if (text.includes("edit") || text.includes("revisi")) {
            label = "Menyiapkan form…";
          }
          start(label);
        }
      } catch {
        // invalid URL, ignore
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  if (!active && progress === 0) return null;

  return (
    <div
      className={`portal-preloader-root ${isLeaving ? "is-leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy={active}
    >
      {/* Top slim progress bar */}
      <div className="portal-preloader-bar-wrap" aria-hidden="true">
        <div
          className="portal-preloader-bar"
          style={{ width: `${progress}%` }}
        />
        <div
          className="portal-preloader-bar-glow"
          style={{ left: `${Math.max(0, progress - 10)}%` }}
        />
      </div>

      {/* Floating pill indicator */}
      <div className="portal-preloader-pill">
        <span className="portal-preloader-spinner" aria-hidden="true" />
        <span className="portal-preloader-text">{message}</span>
      </div>
    </div>
  );
}

export default function PortalPreloader() {
  return (
    <Suspense fallback={null}>
      <PortalPreloaderInner />
    </Suspense>
  );
}

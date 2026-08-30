"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const MIN_VISIBLE_MS = 360;
const LEAVE_ANIMATION_MS = 260;
const NAVIGATION_SAFETY_MS = 15000;

export default function Preloader() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const visibleSinceRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationActiveRef = useRef(false);
  const lastPathnameRef = useRef(pathname);

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (removeTimerRef.current) {
      clearTimeout(removeTimerRef.current);
      removeTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const finishNavigation = useCallback(() => {
    if (!navigationActiveRef.current) return;
    navigationActiveRef.current = false;

    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }

    const elapsed = performance.now() - visibleSinceRef.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      if (navigationActiveRef.current) return;
      setIsLeaving(true);
      removeTimerRef.current = setTimeout(() => {
        removeTimerRef.current = null;
        if (!navigationActiveRef.current) setIsVisible(false);
      }, LEAVE_ANIMATION_MS);
    }, wait);
  }, []);

  const beginNavigation = useCallback(() => {
    if (navigationActiveRef.current) return;
    clearTimers();
    navigationActiveRef.current = true;
    visibleSinceRef.current = performance.now();
    setIsLeaving(false);
    setIsVisible(true);

    safetyTimerRef.current = setTimeout(() => {
      finishNavigation();
    }, NAVIGATION_SAFETY_MS);
  }, [clearTimers, finishNavigation]);

  // Selesai ketika App Router sudah berpindah ke pathname tujuan.
  useEffect(() => {
    if (lastPathnameRef.current !== pathname) {
      lastPathnameRef.current = pathname;
      finishNavigation();
    }
  }, [pathname, finishNavigation]);

  // Overlay besar hanya dimulai oleh perpindahan halaman, bukan oleh fetch/API
  // yang masih berada pada halaman yang sama.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      let destination: URL;
      try {
        destination = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (destination.origin !== window.location.origin) return;

      const current = new URL(window.location.href);
      const samePage = destination.pathname === current.pathname && destination.search === current.search;
      if (samePage) return;

      beginNavigation();
    };

    const onSubmit = (event: SubmitEvent) => {
      queueMicrotask(() => {
        // Form client-side yang memakai preventDefault adalah proses lokal dan
        // harus memakai loader kecil milik komponennya sendiri.
        if (!event.defaultPrevented) beginNavigation();
      });
    };

    const onNavigationStart = () => beginNavigation();

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit);
    window.addEventListener("si-parik:navigation-start", onNavigationStart);

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit);
      window.removeEventListener("si-parik:navigation-start", onNavigationStart);
    };
  }, [beginNavigation]);

  // Query-string navigation dapat commit tanpa mengubah pathname. Next.js
  // menulis history setelah route selesai, sehingga overlay bisa ditutup di sini.
  useEffect(() => {
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = (...args: Parameters<History["pushState"]>) => {
      const result = originalPushState(...args);
      window.setTimeout(() => finishNavigation(), 0);
      return result;
    };

    window.history.replaceState = (...args: Parameters<History["replaceState"]>) => {
      const result = originalReplaceState(...args);
      window.setTimeout(() => finishNavigation(), 0);
      return result;
    };

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [finishNavigation]);

  // Back/forward juga merupakan perpindahan halaman. Beri waktu singkat untuk
  // commit route; jika pathname berubah, effect di atas akan menutup overlay.
  useEffect(() => {
    const onPopState = () => {
      beginNavigation();
      window.setTimeout(() => finishNavigation(), 900);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [beginNavigation, finishNavigation]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  if (!isVisible) return null;

  return (
    <div
      className={`app-preloader${isLeaving ? " app-preloader--leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy={!isLeaving}
      aria-label="Memuat halaman"
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

        <div className="app-preloader__status-text">Memuat halaman...</div>

        <div className="app-preloader__progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type LoadingKind = "initial" | "navigation" | "process";

type LoadingToken = {
  active: boolean;
  timer: ReturnType<typeof setTimeout> | null;
  safetyTimer: ReturnType<typeof setTimeout> | null;
};

const MIN_VISIBLE_MS = 460;
const LEAVE_ANIMATION_MS = 300;
const FETCH_SHOW_DELAY_MS = 110;
const NAVIGATION_SAFETY_MS = 15000;

function labelFor(kind: LoadingKind) {
  if (kind === "navigation") return "Memuat halaman...";
  if (kind === "process") return "Memproses data...";
  return "Menyiapkan SI PARIK BANGKA...";
}

function getRequestMeta(input: RequestInfo | URL, init?: RequestInit) {
  const request = typeof Request !== "undefined" && input instanceof Request ? input : null;
  const method = String(init?.method ?? request?.method ?? "GET").toUpperCase();
  const rawUrl = request?.url ?? String(input);

  let url: URL | null = null;
  try {
    url = new URL(rawUrl, window.location.href);
  } catch {
    url = null;
  }

  return { method, url };
}

function shouldTrackFetch(input: RequestInfo | URL, init?: RequestInit) {
  const { method, url } = getRequestMeta(input, init);
  if (!url) return method !== "GET" && method !== "HEAD";

  // Next.js melakukan prefetch RSC di belakang layar. Jangan tampilkan preloader
  // hanya karena user hover/viewport memicu prefetch.
  if (url.searchParams.has("_rsc") || url.pathname.startsWith("/_next/")) return false;

  // Presence adalah heartbeat periodik, bukan proses yang sedang ditunggu user.
  if (url.pathname === "/api/chat/presence") return false;

  // GET chat berjalan sebagai polling periodik. Mutasi (POST) tetap ditampilkan
  // sebagai proses karena berasal dari aksi kirim pesan user.
  if (
    (url.pathname === "/api/chat/staff" || url.pathname === "/api/chat/guest") &&
    (method === "GET" || method === "HEAD" || method === "PATCH")
  ) {
    return false;
  }

  return true;
}

export default function Preloader() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [label, setLabel] = useState(labelFor("initial"));

  const activeCountRef = useRef(0);
  const visibleSinceRef = useRef<number>(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationTokenRef = useRef<LoadingToken | null>(null);

  const cancelHideTimers = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (removeTimerRef.current) {
      clearTimeout(removeTimerRef.current);
      removeTimerRef.current = null;
    }
  }, []);

  const activateToken = useCallback((token: LoadingToken, kind: LoadingKind) => {
    if (token.active) return;
    token.active = true;
    activeCountRef.current += 1;

    if (activeCountRef.current === 1) {
      visibleSinceRef.current = performance.now();
    }

    cancelHideTimers();
    setLabel(labelFor(kind));
    setIsLeaving(false);
    setIsVisible(true);
  }, [cancelHideTimers]);

  const beginLoading = useCallback((kind: LoadingKind, delayMs = 0) => {
    const token: LoadingToken = { active: false, timer: null, safetyTimer: null };

    if (delayMs > 0) {
      token.timer = setTimeout(() => {
        token.timer = null;
        activateToken(token, kind);
      }, delayMs);
    } else {
      activateToken(token, kind);
    }

    return token;
  }, [activateToken]);

  const endLoading = useCallback((token: LoadingToken | null) => {
    if (!token) return;

    if (token.timer) {
      clearTimeout(token.timer);
      token.timer = null;
    }
    if (token.safetyTimer) {
      clearTimeout(token.safetyTimer);
      token.safetyTimer = null;
    }
    if (!token.active) return;

    token.active = false;
    activeCountRef.current = Math.max(0, activeCountRef.current - 1);
    if (activeCountRef.current > 0) return;

    const elapsed = performance.now() - visibleSinceRef.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);

    cancelHideTimers();
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      // Sebelum mulai fade, pastikan tidak ada proses baru yang aktif.
      if (activeCountRef.current > 0) return;
      setIsLeaving(true);
      removeTimerRef.current = setTimeout(() => {
        removeTimerRef.current = null;
        if (activeCountRef.current === 0) setIsVisible(false);
      }, LEAVE_ANIMATION_MS);
    }, wait);
  }, [cancelHideTimers]);

  const finishNavigation = useCallback(() => {
    const token = navigationTokenRef.current;
    navigationTokenRef.current = null;
    endLoading(token);
  }, [endLoading]);

  const beginNavigation = useCallback(() => {
    if (navigationTokenRef.current) return;
    const token = beginLoading("navigation");
    navigationTokenRef.current = token;
    token.safetyTimer = setTimeout(() => {
      if (navigationTokenRef.current === token) {
        navigationTokenRef.current = null;
      }
      endLoading(token);
    }, NAVIGATION_SAFETY_MS);
  }, [beginLoading, endLoading]);

  // Initial page load, termasuk dashboard/admin/login/akun.
  useEffect(() => {
    const token = beginLoading("initial");

    const finish = () => {
      // Beri browser satu frame untuk menyelesaikan paint awal.
      requestAnimationFrame(() => endLoading(token));
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
    }

    const fallback = setTimeout(() => endLoading(token), 4000);
    return () => {
      window.removeEventListener("load", finish);
      clearTimeout(fallback);
      endLoading(token);
    };
  }, [beginLoading, endLoading]);

  // Route App Router selesai ketika pathname telah berubah.
  useEffect(() => {
    finishNavigation();
  }, [pathname, finishNavigation]);

  // Tangkap navigasi link sebelum Next.js memulai perpindahan route.
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
      const sameDocument =
        destination.pathname === current.pathname &&
        destination.search === current.search;
      if (sameDocument) return;

      beginNavigation();
    };

    const onSubmit = (event: SubmitEvent) => {
      // React/client forms yang preventDefault akan ditangani oleh fetch tracker.
      queueMicrotask(() => {
        if (!event.defaultPrevented) beginNavigation();
      });
    };

    const onPopState = () => beginNavigation();

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit);
      window.removeEventListener("popstate", onPopState);
    };
  }, [beginNavigation]);

  // Query-only navigation dapat selesai tanpa mengubah pathname. Next.js
  // melakukan pushState/replaceState saat route sudah commit, sehingga token
  // navigasi bisa ditutup di sini juga.
  useEffect(() => {
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = (...args: Parameters<History["pushState"]>) => {
      const result = originalPushState(...args);
      setTimeout(finishNavigation, 0);
      return result;
    };

    window.history.replaceState = (...args: Parameters<History["replaceState"]>) => {
      const result = originalReplaceState(...args);
      setTimeout(finishNavigation, 0);
      return result;
    };

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [finishNavigation]);

  // Jadikan fetch sebagai sumber indikator proses global. Request yang sangat
  // cepat (<110ms) tidak menyalakan overlay sehingga UI tidak berkedip.
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (!shouldTrackFetch(input, init)) {
        return originalFetch(input, init);
      }

      const token = beginLoading("process", FETCH_SHOW_DELAY_MS);
      try {
        return await originalFetch(input, init);
      } finally {
        endLoading(token);
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [beginLoading, endLoading]);

  if (!isVisible) return null;

  return (
    <div
      className={`app-preloader${isLeaving ? " app-preloader--leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy={!isLeaving}
      aria-label={label}
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

        <div className="app-preloader__status-text">{label}</div>

        <div className="app-preloader__progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}

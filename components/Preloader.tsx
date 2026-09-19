"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const INITIAL_MIN_VISIBLE_MS = 650;
const TRANSITION_MIN_MS = 450;
const FALLBACK_HIDE_MS = 2200;
const NAVIGATION_TIMEOUT_MS = 6000;
const SKIP_PATH_PREFIXES = ["/dashboard", "/admin", "/akun", "/petugas", "/login"];

export const GUEST_NAV_START_EVENT = "guest:navigation:start";
export const GUEST_NAV_STOP_EVENT = "guest:navigation:stop";

export function startGuestNavigation() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(GUEST_NAV_START_EVENT));
}

export function stopGuestNavigation() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(GUEST_NAV_STOP_EVENT));
}

export default function Preloader() {
  const pathname = usePathname();
  const shouldSkip = SKIP_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  const [isVisible, setIsVisible] = useState(!shouldSkip);
  const [isLeaving, setIsLeaving] = useState(false);

  const isNavigatingRef = useRef(false);
  const showStartRef = useRef<number>(typeof performance !== "undefined" ? performance.now() : 0);
  const currentPathRef = useRef(pathname);

  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (removeTimerRef.current) {
      clearTimeout(removeTimerRef.current);
      removeTimerRef.current = null;
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const hide = useCallback(
    (minDuration = TRANSITION_MIN_MS) => {
      clearTimers();
      const elapsed = performance.now() - showStartRef.current;
      const remaining = Math.max(0, minDuration - elapsed);

      leaveTimerRef.current = setTimeout(() => {
        setIsLeaving(true);
        removeTimerRef.current = setTimeout(() => {
          setIsVisible(false);
          setIsLeaving(false);
          isNavigatingRef.current = false;
        }, 420);
      }, remaining);
    },
    [clearTimers],
  );

  const show = useCallback(() => {
    clearTimers();
    showStartRef.current = performance.now();
    isNavigatingRef.current = true;
    setIsLeaving(false);
    setIsVisible(true);

    fallbackTimerRef.current = setTimeout(() => {
      hide(0);
    }, NAVIGATION_TIMEOUT_MS);
  }, [clearTimers, hide]);

  // Initial page load finish handler
  useEffect(() => {
    if (shouldSkip) {
      setIsVisible(false);
      return;
    }

    let finishScheduled = false;
    let frameId: number | undefined;

    const finishInitial = () => {
      if (finishScheduled) return;
      finishScheduled = true;
      hide(INITIAL_MIN_VISIBLE_MS);
    };

    if (document.readyState === "complete") {
      frameId = requestAnimationFrame(finishInitial);
    } else {
      window.addEventListener("load", finishInitial, { once: true });
    }

    fallbackTimerRef.current = setTimeout(finishInitial, FALLBACK_HIDE_MS);

    return () => {
      window.removeEventListener("load", finishInitial);
      if (frameId !== undefined) cancelAnimationFrame(frameId);
      clearTimers();
    };
  }, [shouldSkip, hide, clearTimers]);

  // Pathname change handler (navigation completed)
  useEffect(() => {
    if (shouldSkip) {
      setIsVisible(false);
      setIsLeaving(false);
      isNavigatingRef.current = false;
      currentPathRef.current = pathname;
      return;
    }

    if (currentPathRef.current !== pathname) {
      currentPathRef.current = pathname;
      if (isNavigatingRef.current || isVisible) {
        hide(TRANSITION_MIN_MS);
      }
    }
  }, [pathname, shouldSkip, isVisible, hide]);

  // Click interceptor for route change (pindah halaman)
  useEffect(() => {
    if (shouldSkip) return;

    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref) return;
      if (anchor.target === "_blank") return;
      if (
        rawHref.startsWith("#") ||
        rawHref.startsWith("javascript:") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:")
      ) {
        return;
      }

      // Important: Pagination clicks MUST NOT trigger the full SI PARIK logo preloader!
      if (
        anchor.closest(".public-pagination") ||
        anchor.closest("[data-pagination]") ||
        anchor.hasAttribute("data-pagination-link")
      ) {
        return;
      }

      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;

        // Skip portal paths
        if (SKIP_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
          return;
        }

        // Only trigger preloader if moving to a DIFFERENT page (different pathname)
        if (url.pathname === window.location.pathname) {
          return;
        }

        // Trigger preloader for page transition!
        show();
      } catch {
        // Invalid URL, ignore
      }
    };

    const handlePopState = () => {
      if (window.location.pathname !== currentPathRef.current) {
        show();
      }
    };

    const handleNavStart = () => {
      show();
    };

    const handleNavStop = () => {
      hide(0);
    };

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("popstate", handlePopState);
    window.addEventListener(GUEST_NAV_START_EVENT, handleNavStart);
    window.addEventListener(GUEST_NAV_STOP_EVENT, handleNavStop);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener(GUEST_NAV_START_EVENT, handleNavStart);
      window.removeEventListener(GUEST_NAV_STOP_EVENT, handleNavStop);
    };
  }, [shouldSkip, show, hide]);

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

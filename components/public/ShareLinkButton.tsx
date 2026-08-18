"use client";

import { useEffect, useRef, useState } from "react";

type ShareLinkButtonProps = {
  title: string;
  text?: string;
  label?: string;
};

type ShareStatus = "idle" | "success";

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M18 8a3 3 0 1 0-2.83-4A3 3 0 0 0 15 5c0 .2.02.39.06.58L8.91 9.16A3 3 0 0 0 7 8.5a3.5 3.5 0 1 0 1.91 6.43l6.15 3.58A3 3 0 0 0 15 19a3 3 0 1 0 .83-2.07l-6.2-3.61a3.4 3.4 0 0 0 0-2.64l6.2-3.61A3 3 0 0 0 18 8Zm0-5a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM7 14.5A2.5 2.5 0 1 1 7 9a2.5 2.5 0 0 1 0 5.5ZM18 17a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9.2 16.6 4.8 12.2l1.4-1.4 3 3 8.6-8.6 1.4 1.4-10 10Z" />
    </svg>
  );
}

export default function ShareLinkButton({ title, text, label = "Bagikan tautan" }: ShareLinkButtonProps) {
  const [status, setStatus] = useState<ShareStatus>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const showSuccess = () => {
    setStatus("success");
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), 1800);
  };

  const copyFallback = (url: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  };

  const handleShare = async () => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        showSuccess();
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showSuccess();
        return;
      }

      if (copyFallback(url)) showSuccess();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          showSuccess();
          return;
        }
        if (copyFallback(url)) showSuccess();
      } catch {
        // Tidak melakukan apa pun jika browser memblokir fitur salin/share.
      }
    }
  };

  const isSuccess = status === "success";
  const accessibleLabel = isSuccess ? "Tautan berhasil dibagikan atau disalin" : label;

  return (
    <button
      type="button"
      className={`public-share-icon-button${isSuccess ? " is-success" : ""}`}
      onClick={handleShare}
      aria-label={accessibleLabel}
      title={isSuccess ? "Tautan berhasil disalin" : label}
    >
      {isSuccess ? <CheckIcon /> : <ShareIcon />}
      <span className="public-share-tooltip" aria-hidden="true">
        {isSuccess ? "Tautan disalin" : "Bagikan"}
      </span>
    </button>
  );
}

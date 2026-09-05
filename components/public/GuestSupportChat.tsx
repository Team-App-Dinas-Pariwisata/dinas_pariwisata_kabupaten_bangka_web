"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

const STORAGE_KEY = "si_parik_guest_chat_id_v1";
const SEEN_KEY = "si_parik_guest_chat_seen_v1";
const GUEST_POLL_MS = 4000;
const PRESENCE_POLL_MS = 15000;

type ChatMessage = {
  id: number;
  conversation_id: number;
  sender_type: "guest" | "staff";
  sender_user_id: number | null;
  sender_name_snapshot: string | null;
  message: string;
  created_at: string;
};

type GuestPayload = {
  data?: {
    conversation: { id: number; guest_identifier: string } | null;
    messages: ChatMessage[];
  };
  message?: string;
};

function newGuestIdentifier() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `guest_${crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function timeLabel(value: string) {
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export default function GuestSupportChat() {
  const pathname = usePathname();
  const hidden = ["/dashboard", "/admin", "/petugas", "/login", "/akun"].some((prefix) => pathname.startsWith(prefix));

  const [guestId, setGuestId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [onlineStaffCount, setOnlineStaffCount] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (hidden) return;
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = newGuestIdentifier();
      localStorage.setItem(STORAGE_KEY, id);
    }
    setGuestId(id);
  }, [hidden]);

  const loadMessages = useCallback(async () => {
    if (!guestId) return;
    const response = await fetch(`/api/chat/guest?guest_id=${encodeURIComponent(guestId)}`, { cache: "no-store" });
    const payload = (await response.json()) as GuestPayload;
    setMessages(payload.data?.messages ?? []);
  }, [guestId]);

  const checkPresence = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/presence", { cache: "no-store" });
      const payload = await response.json();
      setOnlineStaffCount(payload.data?.online_count ?? 0);
    } catch {
      setOnlineStaffCount(0);
    }
  }, []);

  useEffect(() => {
    if (!guestId || hidden) return;
    void loadMessages();
    void checkPresence();
    const a = window.setInterval(loadMessages, GUEST_POLL_MS);
    const b = window.setInterval(checkPresence, PRESENCE_POLL_MS);
    return () => {
      window.clearInterval(a);
      window.clearInterval(b);
    };
  }, [guestId, hidden, loadMessages, checkPresence]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = message.trim();
    if (!text || !guestId) return;

    await fetch("/api/chat/guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guest_id: guestId, message: text }),
    });

    setMessage("");
    await loadMessages();
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") void sendMessage();
  }

  if (hidden) return null;

  return (
    <>
      {!isOpen && (
        <button type="button" onClick={() => setIsOpen(true)} className="ai-launcher unified-chat-launcher">
          <span className="ai-launcher-label">Chat Petugas</span>
        </button>
      )}

      {isOpen && (
        <section className="ai-panel unified-chat-panel" role="dialog" aria-label="Chat Petugas">
          <header className="ai-panel-head unified-chat-head">
            <div>
              <strong>Chat dengan Petugas</strong>
              <div>{onlineStaffCount ? `${onlineStaffCount} petugas online` : "Petugas offline"}</div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)}>×</button>
          </header>

          <div className="ai-panel-body unified-ai-body">
            {messages.length === 0 && <p>Silakan kirim pertanyaan. Petugas akan membalas melalui chat ini.</p>}
            {messages.map((item) => (
              <div key={item.id} className={`ai-bubble ${item.sender_type === "guest" ? "is-user" : ""}`}>
                <strong>{item.sender_type === "guest" ? "Anda" : "Petugas"}</strong>
                <div>{item.message}</div>
                <small>{timeLabel(item.created_at)}</small>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="ai-input-wrap">
            <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={onKeyDown} placeholder="Tulis pesan ke petugas..." />
            <button type="button" onClick={() => void sendMessage()}>Kirim</button>
          </div>
        </section>
      )}
    </>
  );
}

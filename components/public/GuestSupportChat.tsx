"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

const STORAGE_KEY = "si_parik_guest_chat_id_v1";
const SEEN_KEY = "si_parik_guest_chat_seen_v1";
const GUEST_POLL_MS = 4000;
const PRESENCE_POLL_MS = 15000;

type ChatTab = "staff" | "ai";

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

type AiChatMessage = {
  role: "assistant" | "user";
  text: string;
};

function newGuestIdentifier() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `guest_${crypto.randomUUID().replace(/-/g, "")}`;
  }
  const random = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return `guest_${Date.now().toString(36)}_${random}`;
}

function shortGuestId(guestId: string) {
  return guestId.replace(/^guest_/, "").slice(-6).toUpperCase();
}

function timeLabel(value: string) {
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(date);
}

const aiExamples = [
  "Cari wisata bahari di Bangka dengan tiket maksimal Rp15.000, utamakan akses mudah",
  "Cari kuliner seafood halal maksimal Rp100.000 yang tersedia delivery",
  "Cari hotel minimal bintang 3 dengan budget maksimal Rp700.000",
  "Cari satwa endemik Mentilin dengan lokasi pengamatan",
];

export default function GuestSupportChat() {
  const pathname = usePathname();
  const hidden = ["/dashboard", "/admin", "/petugas", "/login", "/akun"].some((prefix) => pathname.startsWith(prefix));

  const [guestId, setGuestId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatTab>("ai");
  const [onlineStaffCount, setOnlineStaffCount] = useState<number | null>(null);
  const presenceResolvedRef = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [lastSeenId, setLastSeenId] = useState(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [aiQuestion, setAiQuestion] = useState("");
  const [aiSending, setAiSending] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([
    {
      role: "assistant",
      text: "Halo! Tulis kebutuhan wisata Anda. Contoh pertanyaan di bawah sudah disesuaikan dengan data yang tersedia pada database sehingga dapat langsung menghasilkan alternatif untuk dirangking dengan SAW.",
    },
  ]);

  useEffect(() => {
    if (hidden) return;
    let value = window.localStorage.getItem(STORAGE_KEY) ?? "";
    if (!/^guest_[a-zA-Z0-9_-]{20,80}$/.test(value)) {
      value = newGuestIdentifier();
      window.localStorage.setItem(STORAGE_KEY, value);
    }
    setGuestId(value);
    setLastSeenId(Number(window.localStorage.getItem(SEEN_KEY) ?? 0));
  }, [hidden]);

  const checkPresence = useCallback(async () => {
    if (hidden) return;
    try {
      const response = await fetch("/api/chat/presence", { cache: "no-store" });
      const payload = await response.json() as { data?: { online_count?: number } };
      const count = response.ok ? Math.max(0, Number(payload.data?.online_count ?? 0)) : 0;
      setOnlineStaffCount(count);

      if (!presenceResolvedRef.current) {
        presenceResolvedRef.current = true;
        setActiveTab(count > 0 ? "staff" : "ai");
      }
    } catch {
      setOnlineStaffCount(0);
      if (!presenceResolvedRef.current) {
        presenceResolvedRef.current = true;
        setActiveTab("ai");
      }
    }
  }, [hidden]);

  useEffect(() => {
    if (hidden) return;
    void checkPresence();
    const timer = window.setInterval(() => void checkPresence(), PRESENCE_POLL_MS);
    return () => window.clearInterval(timer);
  }, [checkPresence, hidden]);

  const loadMessages = useCallback(async () => {
    if (!guestId) return;
    try {
      const response = await fetch(`/api/chat/guest?guest_id=${encodeURIComponent(guestId)}`, { cache: "no-store" });
      const payload = (await response.json()) as GuestPayload;
      if (!response.ok) throw new Error(payload.message || "Chat belum dapat dimuat.");
      setMessages(payload.data?.messages ?? []);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Chat belum dapat dimuat.");
    }
  }, [guestId]);

  useEffect(() => {
    if (!guestId || hidden) return;
    void loadMessages();
    const timer = window.setInterval(() => void loadMessages(), GUEST_POLL_MS);
    return () => window.clearInterval(timer);
  }, [guestId, hidden, loadMessages]);

  useEffect(() => {
    if (!isOpen || activeTab !== "staff") return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    const latest = messages[messages.length - 1]?.id ?? 0;
    if (latest > lastSeenId) {
      setLastSeenId(latest);
      window.localStorage.setItem(SEEN_KEY, String(latest));
    }
  }, [messages, isOpen, activeTab, lastSeenId]);

  const unread = messages.filter((message) => message.sender_type === "staff" && message.id > lastSeenId).length;
  const staffOnline = (onlineStaffCount ?? 0) > 0;

  function openPanel() {
    setIsOpen(true);
    setActiveTab(staffOnline ? "staff" : "ai");
    void checkPresence();
  }

  async function sendMessage() {
    const message = input.trim();
    if (!guestId || !message || isSending) return;
    setIsSending(true);
    setError("");
    try {
      const response = await fetch("/api/chat/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_id: guestId, message }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "Pesan belum dapat dikirim.");
      setInput("");
      await loadMessages();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Pesan belum dapat dikirim.");
    } finally {
      setIsSending(false);
    }
  }

  function getLocationIfNeeded(message: string) {
    const needsLocation = /\b(dekat|terdekat|jarak|radius|\d+(?:[.,]\d+)?\s*(?:km|kilometer|meter|m))\b/i.test(message);
    if (!needsLocation || !navigator.geolocation) {
      return Promise.resolve<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });
    }

    return new Promise<{ latitude: number | null; longitude: number | null }>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        () => resolve({ latitude: null, longitude: null }),
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 120000 },
      );
    });
  }

  async function sendAiQuestion(value?: string) {
    const message = (value ?? aiQuestion).trim();
    if (!message || aiSending) return;

    setAiQuestion("");
    setAiSending(true);
    setAiMessages((current) => [...current, { role: "user", text: message }]);

    try {
      const location = await getLocationIfNeeded(message);
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });
      const payload = await response.json() as {
        type?: string;
        response?: string;
        redirect_url?: string;
        message?: string;
      };
      if (!response.ok) throw new Error(payload.message || "Chatbot belum dapat memproses pertanyaan.");

      const reply = payload.response || "Permintaan sudah diproses.";
      setAiMessages((current) => [...current, { role: "assistant", text: reply }]);

      if (payload.type === "search_redirect" && payload.redirect_url) {
        window.setTimeout(() => window.location.assign(payload.redirect_url as string), 850);
      }
    } catch (aiError) {
      setAiMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: aiError instanceof Error ? aiError.message : "Layanan NLP belum dapat dihubungi.",
        },
      ]);
    } finally {
      setAiSending(false);
    }
  }

  function handleAiKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void sendAiQuestion();
    }
  }

  if (hidden) return null;

  return (
    <>
      {!isOpen && (
        <button type="button" onClick={openPanel} className="ai-launcher unified-chat-launcher" aria-label="Buka Pojok Bincang">
          <span className="ai-launcher-label" aria-hidden="true">
            <span>Welcome To</span>
            <span>&quot;POJOK BINCANG&quot;</span>
          </span>
          <span className="ai-launcher-visual" aria-hidden="true"><img src="/pojok-bincang.png" alt="Pojok Bincang" /></span>
          {unread > 0 && <b className="unified-chat-unread">{unread > 9 ? "9+" : unread}</b>}
        </button>
      )}

      {isOpen && (
        <section className="ai-panel unified-chat-panel" role="dialog" aria-label="Pojok Bincang">
          <header className="ai-panel-head unified-chat-head">
            <div>
              <span className={`ai-status ${staffOnline ? "is-staff-online" : "is-ai-online"}`}>
                <i />
                {staffOnline
                  ? `${onlineStaffCount} PETUGAS ONLINE`
                  : onlineStaffCount === null ? "MENGECEK PETUGAS" : "AI ONLINE · PETUGAS OFFLINE"}
              </span>
              <strong>POJOK BINCANG</strong>
              <small>Asisten informasi ekraf &amp; pariwisata</small>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Tutup Pojok Bincang">×</button>
          </header>

          <div className="unified-chat-tabs" role="tablist" aria-label="Pilihan layanan chat">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "staff"}
              className={activeTab === "staff" ? "active" : ""}
              onClick={() => setActiveTab("staff")}
            >
              <span>Chat dengan Petugas</span>
              <small>{staffOnline ? `${onlineStaffCount} online` : onlineStaffCount === null ? "Mengecek..." : "Offline · tetap bisa kirim"}</small>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "ai"}
              className={activeTab === "ai" ? "active" : ""}
              onClick={() => setActiveTab("ai")}
            >
              <span>Chat dengan AI</span>
              <small>Siap digunakan</small>
            </button>
          </div>

          {activeTab === "staff" ? (
            <div className="unified-staff-chat" role="tabpanel">
              <div className="support-chat-meta">ID Pengunjung: <strong>{guestId ? shortGuestId(guestId) : "..."}</strong></div>

              <div className="support-chat-messages" aria-live="polite">
                <div className={`support-chat-welcome ${staffOnline ? "" : "is-offline"}`}>
                  {staffOnline
                    ? "Halo. Petugas sedang online. Silakan tulis pesan Anda. Semua petugas dapat melihat percakapan ini dan petugas lain dapat melanjutkan balasan bila diperlukan."
                    : "Petugas sedang offline. Anda tetap dapat mengirim pesan. Pesan akan tersimpan di MySQL dan dapat dibaca serta dibalas oleh petugas saat mereka login kembali."}
                </div>
                {messages.map((message) => (
                  <div className={`support-chat-message ${message.sender_type === "guest" ? "is-guest" : "is-staff"}`} key={message.id}>
                    {message.sender_type === "staff" && (
                      <span className="support-chat-sender">{message.sender_name_snapshot || "Petugas SI PARIK"}</span>
                    )}
                    <div>{message.message}</div>
                    <small>{timeLabel(message.created_at)}</small>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {error && <div className="support-chat-error">{error}</div>}

              <div className="support-chat-compose">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Tulis pesan untuk petugas..."
                  maxLength={2000}
                  rows={1}
                  aria-label="Pesan untuk petugas"
                  disabled={isSending}
                />
                <button type="button" onClick={() => void sendMessage()} disabled={isSending || !input.trim()} aria-label="Kirim pesan">
                  {isSending ? "..." : "Kirim"}
                </button>
              </div>
              <div className="support-chat-foot">Percakapan tersimpan di MySQL dan dimuat kembali untuk browser ini saat Anda berkunjung lagi.</div>
            </div>
          ) : (
            <div className="ai-panel-body unified-ai-body" role="tabpanel">
              <div className="ai-conversation" aria-live="polite">
                {aiMessages.map((message, index) => (
                  <div className={`ai-bubble ${message.role === "user" ? "is-user" : ""}`} key={`${message.role}-${index}`}>
                    {message.text}
                  </div>
                ))}
                {aiSending && <div className="ai-bubble is-loading">Menganalisis kebutuhan dan kriteria SPK...</div>}
              </div>
              <div className="ai-example-label">Contoh pertanyaan</div>
              <div className="ai-chips">
                {aiExamples.map((example) => (
                  <button type="button" key={example} onClick={() => void sendAiQuestion(example)} disabled={aiSending}>
                    {example}
                  </button>
                ))}
              </div>
              <div className="ai-input-wrap">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(event) => setAiQuestion(event.target.value)}
                  onKeyDown={handleAiKeyDown}
                  placeholder="Contoh: kuliner seafood halal maksimal Rp100.000..."
                  aria-label="Pertanyaan untuk AI"
                  disabled={aiSending}
                />
                <button type="button" aria-label="Kirim pertanyaan" onClick={() => void sendAiQuestion()} disabled={aiSending || !aiQuestion.trim()}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}

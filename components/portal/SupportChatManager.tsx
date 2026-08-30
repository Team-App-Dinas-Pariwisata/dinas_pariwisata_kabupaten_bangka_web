"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { InlineLoader } from "../InlineLoader";

type Conversation = {
  id: number;
  guest_identifier: string;
  status: "open" | "closed";
  created_at: string;
  last_message_at: string;
  last_message: string | null;
  last_sender_type: "guest" | "staff" | null;
  last_sender_name: string | null;
  total_messages: number;
};

type ChatMessage = {
  id: number;
  conversation_id: number;
  sender_type: "guest" | "staff";
  sender_user_id: number | null;
  sender_name_snapshot: string | null;
  message: string;
  created_at: string;
};

function safeText(value: unknown) {
  return String(value ?? "").trim();
}

function guestLabel(value: unknown) {
  const identifier = safeText(value);
  if (!identifier) return "Pengunjung";
  return `Pengunjung ${identifier.replace(/^guest_/, "").slice(-6).toUpperCase()}`;
}

function guestInitial(value: unknown) {
  return safeText(value).replace(/^guest_/, "").slice(-1).toUpperCase() || "G";
}

function guestShortId(value: unknown, length = 12) {
  const identifier = safeText(value);
  return identifier ? identifier.replace(/^guest_/, "").slice(-length).toUpperCase() : "-";
}

function formatTime(value: unknown, detailed = false) {
  const text = safeText(value);
  if (!text) return "-";
  const date = new Date(text.includes("T") ? text : text.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", detailed
    ? { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }
    : { hour: "2-digit", minute: "2-digit" },
  ).format(date);
}

export default function SupportChatManager() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/staff", { cache: "no-store" });
      const payload = await response.json() as { data?: Conversation[]; message?: string };
      if (!response.ok) throw new Error(payload.message || "Daftar chat belum dapat dimuat.");
      const rows = (payload.data ?? [])
        .filter((item) => Number(item?.id) > 0 && Boolean(safeText(item?.guest_identifier)))
        .map((item) => ({
          ...item,
          id: Number(item.id),
          guest_identifier: safeText(item.guest_identifier),
          status: item.status === "closed" ? "closed" as const : "open" as const,
          created_at: safeText(item.created_at),
          last_message_at: safeText(item.last_message_at) || safeText(item.created_at),
          last_message: item.last_message == null ? null : safeText(item.last_message),
          last_sender_type: item.last_sender_type === "staff" ? "staff" as const : item.last_sender_type === "guest" ? "guest" as const : null,
          last_sender_name: item.last_sender_name == null ? null : safeText(item.last_sender_name),
          total_messages: Number(item.total_messages ?? 0),
        }));
      setConversations(rows);
      setSelectedId((current) => current ?? rows[0]?.id ?? null);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Daftar chat belum dapat dimuat.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: number) => {
    try {
      const response = await fetch(`/api/chat/staff?conversation_id=${conversationId}`, { cache: "no-store" });
      const payload = await response.json() as { data?: { messages: ChatMessage[] }; message?: string };
      if (!response.ok) throw new Error(payload.message || "Percakapan belum dapat dimuat.");
      setMessages((payload.data?.messages ?? [])
        .filter((message) => Number(message?.id) > 0)
        .map((message) => ({
          ...message,
          id: Number(message.id),
          conversation_id: Number(message.conversation_id),
          sender_type: message.sender_type === "staff" ? "staff" as const : "guest" as const,
          sender_user_id: message.sender_user_id == null ? null : Number(message.sender_user_id),
          sender_name_snapshot: message.sender_name_snapshot == null ? null : safeText(message.sender_name_snapshot),
          message: safeText(message.message),
          created_at: safeText(message.created_at),
        })));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Percakapan belum dapat dimuat.");
    }
  }, []);

  useEffect(() => {
    void loadConversations();
    const timer = window.setInterval(() => void loadConversations(), 3000);
    return () => window.clearInterval(timer);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedId);
    const timer = window.setInterval(() => void loadMessages(selectedId), 2500);
    return () => window.clearInterval(timer);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendReply() {
    const message = input.trim();
    if (!selectedId || !message || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/chat/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: selectedId, message }),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || "Balasan belum dapat dikirim.");
      setInput("");
      await Promise.all([loadMessages(selectedId), loadConversations()]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Balasan belum dapat dikirim.");
    } finally {
      setSending(false);
    }
  }

  const active = conversations.find((item) => item.id === selectedId) ?? null;

  return (
    <section className="staff-chat-page">
      <div className="staff-chat-page-head">
        <div>
          <span className="portal-eyebrow">LAYANAN PENGUNJUNG</span>
          <h1>Chat Guest</h1>
          <p>Semua petugas dapat membuka dan membalas seluruh percakapan. Nama petugas disimpan pada setiap balasan, sehingga percakapan dapat dilanjutkan petugas lain.</p>
        </div>
        <div className="staff-chat-total"><strong>{conversations.length}</strong><span>Percakapan</span></div>
      </div>

      {error && <div className="staff-chat-alert">{error}</div>}

      <div className="staff-chat-workspace">
        <aside className="staff-chat-list">
          <div className="staff-chat-list-head">
            <strong>Semua Percakapan</strong>
            <span>Pembaruan otomatis</span>
          </div>
          <div className="staff-chat-list-scroll">
            {loadingList ? (
              <div className="staff-chat-empty"><InlineLoader label="Memuat percakapan..." /></div>
            ) : conversations.length === 0 ? (
              <div className="staff-chat-empty">Belum ada chat dari guest.</div>
            ) : conversations.map((conversation) => (
              <button
                type="button"
                key={conversation.id}
                className={`staff-chat-list-item ${conversation.id === selectedId ? "active" : ""}`}
                onClick={() => setSelectedId(conversation.id)}
              >
                <span className="staff-chat-guest-avatar">{guestInitial(conversation.guest_identifier)}</span>
                <span className="staff-chat-list-copy">
                  <span className="staff-chat-list-title"><strong>{guestLabel(conversation.guest_identifier)}</strong><time>{formatTime(conversation.last_message_at)}</time></span>
                  <span className="staff-chat-preview">
                    {conversation.last_sender_type === "staff" ? `${conversation.last_sender_name || "Petugas"}: ` : ""}
                    {conversation.last_message || "Percakapan baru"}
                  </span>
                  <small>{conversation.total_messages} pesan</small>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="staff-chat-room">
          {active ? (
            <>
              <header className="staff-chat-room-head">
                <div className="staff-chat-guest-avatar large">{guestInitial(active.guest_identifier)}</div>
                <div><strong>{guestLabel(active.guest_identifier)}</strong><span>ID: {guestShortId(active.guest_identifier, 12)}</span></div>
              </header>

              <div className="staff-chat-messages">
                {messages.map((message) => (
                  <div className={`staff-chat-message ${message.sender_type === "staff" ? "is-staff" : "is-guest"}`} key={message.id}>
                    <span className="staff-chat-message-sender">
                      {message.sender_type === "staff" ? (message.sender_name_snapshot || "Petugas SI PARIK") : guestLabel(active.guest_identifier)}
                    </span>
                    <div>{message.message}</div>
                    <small>{formatTime(message.created_at, true)}</small>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="staff-chat-compose">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendReply();
                    }
                  }}
                  placeholder="Balas sebagai petugas yang sedang login..."
                  maxLength={2000}
                  rows={2}
                  disabled={sending}
                />
                <button type="button" onClick={() => void sendReply()} disabled={sending || !input.trim()}>{sending ? <InlineLoader label="Mengirim..." compact /> : "Kirim Balasan"}</button>
              </div>
            </>
          ) : (
            <div className="staff-chat-room-empty"><strong>Pilih percakapan</strong><span>Chat guest akan tampil di sini.</span></div>
          )}
        </div>
      </div>
    </section>
  );
}

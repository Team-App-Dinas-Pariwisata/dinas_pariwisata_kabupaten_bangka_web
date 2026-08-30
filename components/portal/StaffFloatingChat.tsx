"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PortalIcon } from "./PortalIcon";
import { InlineLoader } from "../InlineLoader";

type Conversation = {
  id: number;
  guest_identifier: string;
  status: "open" | "closed";
  created_at: string;
  last_message_at: string;
  last_message_id: number | null;
  last_message: string | null;
  last_sender_type: "guest" | "staff" | null;
  last_sender_name: string | null;
  total_messages: number;
  unread_count: number;
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

const LIST_POLL_MS = 3000;
const MESSAGE_POLL_MS = 2500;

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

function guestShortId(value: unknown, length = 8) {
  const identifier = safeText(value);
  return identifier ? identifier.replace(/^guest_/, "").slice(-length).toUpperCase() : "-";
}

function formatTime(value: unknown, detailed = false) {
  const text = safeText(value);
  if (!text) return "-";
  const date = new Date(text.includes("T") ? text : text.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(
    "id-ID",
    detailed
      ? { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }
      : { hour: "2-digit", minute: "2-digit" },
  ).format(date);
}

export default function StaffFloatingChat() {
  const pathname = usePathname();
  const hiddenOnFullChatPage = pathname.startsWith("/dashboard/chat") || pathname.startsWith("/admin/chat");
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const lastMarkedRef = useRef<Record<number, number>>({});

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/staff", { cache: "no-store" });
      const payload = (await response.json()) as { data?: Conversation[]; message?: string };
      if (!response.ok) throw new Error(payload.message || "Daftar chat belum dapat dimuat.");
      setConversations((payload.data ?? [])
        .filter((item) => Number(item?.id) > 0 && Boolean(safeText(item?.guest_identifier)))
        .map((item) => ({
          ...item,
          id: Number(item.id),
          guest_identifier: safeText(item.guest_identifier),
          status: item.status === "closed" ? "closed" : "open",
          created_at: safeText(item.created_at),
          last_message_at: safeText(item.last_message_at) || safeText(item.created_at),
          last_message: item.last_message == null ? null : safeText(item.last_message),
          last_sender_type: item.last_sender_type === "staff" ? "staff" : item.last_sender_type === "guest" ? "guest" : null,
          last_sender_name: item.last_sender_name == null ? null : safeText(item.last_sender_name),
          total_messages: Number(item.total_messages ?? 0),
          unread_count: Number(item.unread_count ?? 0),
          last_message_id: item.last_message_id == null ? null : Number(item.last_message_id),
        })));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Daftar chat belum dapat dimuat.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: number, showLoading = false) => {
    if (showLoading) setLoadingMessages(true);
    try {
      const response = await fetch(`/api/chat/staff?conversation_id=${conversationId}`, { cache: "no-store" });
      const payload = (await response.json()) as { data?: { messages: ChatMessage[] }; message?: string };
      if (!response.ok) throw new Error(payload.message || "Percakapan belum dapat dimuat.");
      setMessages((payload.data?.messages ?? [])
        .filter((message) => Number(message?.id) > 0)
        .map((message) => ({
          ...message,
          id: Number(message.id),
          conversation_id: Number(message.conversation_id),
          sender_type: message.sender_type === "staff" ? "staff" : "guest",
          sender_user_id: message.sender_user_id == null ? null : Number(message.sender_user_id),
          sender_name_snapshot: message.sender_name_snapshot == null ? null : safeText(message.sender_name_snapshot),
          message: safeText(message.message),
          created_at: safeText(message.created_at),
        })));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Percakapan belum dapat dimuat.");
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  }, []);

  const markConversationRead = useCallback(async (conversationId: number, lastReadMessageId: number) => {
    if (!conversationId || !lastReadMessageId) return;
    if ((lastMarkedRef.current[conversationId] ?? 0) >= lastReadMessageId) return;

    lastMarkedRef.current[conversationId] = lastReadMessageId;
    setConversations((current) => current.map((conversation) => (
      conversation.id === conversationId ? { ...conversation, unread_count: 0 } : conversation
    )));

    try {
      const response = await fetch("/api/chat/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          last_read_message_id: lastReadMessageId,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "Status pesan belum dapat diperbarui.");
      await loadConversations();
    } catch {
      delete lastMarkedRef.current[conversationId];
      void loadConversations();
    }
  }, [loadConversations]);

  useEffect(() => {
    if (hiddenOnFullChatPage) return;
    void loadConversations();
    const timer = window.setInterval(() => void loadConversations(), LIST_POLL_MS);
    return () => window.clearInterval(timer);
  }, [hiddenOnFullChatPage, loadConversations]);

  useEffect(() => {
    if (hiddenOnFullChatPage || !open) return;
    if (!selectedId) {
      setMessages([]);
      return;
    }

    void loadMessages(selectedId, true);
    const timer = window.setInterval(() => void loadMessages(selectedId), MESSAGE_POLL_MS);
    return () => window.clearInterval(timer);
  }, [hiddenOnFullChatPage, open, selectedId, loadMessages]);

  useEffect(() => {
    if (!open || !selectedId || messages.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    const latestVisibleMessageId = messages[messages.length - 1]?.id ?? 0;
    if (latestVisibleMessageId > 0) {
      void markConversationRead(selectedId, latestVisibleMessageId);
    }
  }, [messages, open, selectedId, markConversationRead]);

  useEffect(() => {
    if (open && selectedId) {
      window.setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open, selectedId]);

  const totalUnreadCount = conversations.reduce((total, conversation) => total + Number(conversation.unread_count || 0), 0);
  const unreadConversationCount = conversations.filter((conversation) => Number(conversation.unread_count || 0) > 0).length;
  const active = conversations.find((item) => item.id === selectedId) ?? null;

  const filteredConversations = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return conversations;
    return conversations.filter((conversation) => {
      const label = guestLabel(conversation.guest_identifier).toLowerCase();
      const preview = (conversation.last_message ?? "").toLowerCase();
      const identifier = safeText(conversation.guest_identifier).toLowerCase();
      return label.includes(keyword) || preview.includes(keyword) || identifier.includes(keyword);
    });
  }, [conversations, query]);

  function selectConversation(id: number) {
    const conversation = conversations.find((item) => item.id === id);
    setSelectedId(id);
    setInput("");
    setError("");

    if (conversation?.last_message_id && conversation.unread_count > 0) {
      void markConversationRead(id, conversation.last_message_id);
    }
  }

  function backToList() {
    setSelectedId(null);
    setMessages([]);
    setInput("");
    setError("");
    void loadConversations();
  }

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
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "Balasan belum dapat dikirim.");
      setInput("");
      await Promise.all([loadMessages(selectedId), loadConversations()]);
      inputRef.current?.focus();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Balasan belum dapat dikirim.");
    } finally {
      setSending(false);
    }
  }

  if (hiddenOnFullChatPage) return null;

  return (
    <div className="staff-floating-chat-root">
      {!open ? (
        <button
          type="button"
          className="staff-floating-chat-launcher"
          onClick={() => setOpen(true)}
          aria-label={totalUnreadCount > 0 ? `Buka chat guest, ${totalUnreadCount} pesan belum dibaca` : "Buka chat guest"}
        >
          <span className="staff-floating-chat-launcher-icon"><PortalIcon name="chat" /></span>
          <span className="staff-floating-chat-launcher-copy">
            <strong>Chat Guest</strong>
            <small>{totalUnreadCount > 0 ? `${totalUnreadCount} pesan belum dibaca` : "Semua chat sudah dibaca"}</small>
          </span>
          {totalUnreadCount > 0 ? <b>{totalUnreadCount > 99 ? "99+" : totalUnreadCount}</b> : null}
        </button>
      ) : (
        <section className="staff-floating-chat-panel" role="dialog" aria-label="Chat Guest">
          <header className="staff-floating-chat-head">
            <div className="staff-floating-chat-head-copy">
              <span className="staff-floating-chat-status"><i /> PETUGAS ONLINE</span>
              <strong>Chat Guest</strong>
              <small>{totalUnreadCount > 0 ? `${totalUnreadCount} pesan belum dibaca dari ${unreadConversationCount} chat` : "Semua percakapan sudah dibaca"}</small>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup chat">×</button>
          </header>

          {selectedId && active ? (
            <div className="staff-floating-chat-room">
              <div className="staff-floating-chat-room-head">
                <button type="button" onClick={backToList} aria-label="Kembali ke semua percakapan">←</button>
                <span className="staff-floating-chat-avatar">{guestInitial(active.guest_identifier)}</span>
                <div>
                  <strong>{guestLabel(active.guest_identifier)}</strong>
                  <small>{active.total_messages} pesan · ID {guestShortId(active.guest_identifier, 8)}</small>
                </div>
              </div>

              <div className="staff-floating-chat-messages" aria-live="polite">
                {loadingMessages && messages.length === 0 ? (
                  <div className="staff-floating-chat-state"><InlineLoader label="Memuat percakapan..." /></div>
                ) : messages.length === 0 ? (
                  <div className="staff-floating-chat-state">Belum ada pesan pada percakapan ini.</div>
                ) : messages.map((message) => (
                  <div
                    className={`staff-floating-chat-message ${message.sender_type === "staff" ? "is-staff" : "is-guest"}`}
                    key={message.id}
                  >
                    <span>
                      {message.sender_type === "staff"
                        ? message.sender_name_snapshot || "Petugas SI PARIK"
                        : guestLabel(active.guest_identifier)}
                    </span>
                    <p>{message.message}</p>
                    <small>{formatTime(message.created_at, true)}</small>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {error ? <div className="staff-floating-chat-error">{error}</div> : null}

              <div className="staff-floating-chat-compose">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendReply();
                    }
                  }}
                  placeholder="Tulis balasan..."
                  maxLength={2000}
                  rows={2}
                  disabled={sending}
                />
                <button type="button" onClick={() => void sendReply()} disabled={sending || !input.trim()} aria-label="Kirim balasan">
                  {sending ? <InlineLoader compact /> : "➜"}
                </button>
              </div>
            </div>
          ) : (
            <div className="staff-floating-chat-list-view">
              <div className="staff-floating-chat-summary">
                <div><strong>{conversations.length}</strong><span>Total chat</span></div>
                <div><strong>{totalUnreadCount}</strong><span>Belum dibaca</span></div>
              </div>

              <label className="staff-floating-chat-search">
                <PortalIcon name="search" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari pengunjung atau isi pesan..."
                />
              </label>

              {error ? <div className="staff-floating-chat-error">{error}</div> : null}

              <div className="staff-floating-chat-list-scroll">
                {loadingList ? (
                  <div className="staff-floating-chat-state"><InlineLoader label="Memuat semua chat..." /></div>
                ) : filteredConversations.length === 0 ? (
                  <div className="staff-floating-chat-state">
                    {conversations.length === 0 ? "Belum ada chat dari guest." : "Percakapan tidak ditemukan."}
                  </div>
                ) : filteredConversations.map((conversation) => (
                  <button
                    type="button"
                    key={conversation.id}
                    className={`staff-floating-chat-list-item ${conversation.unread_count > 0 ? "has-unread" : ""}`}
                    onClick={() => selectConversation(conversation.id)}
                  >
                    <span className="staff-floating-chat-avatar">{guestInitial(conversation.guest_identifier)}</span>
                    <span className="staff-floating-chat-list-copy">
                      <span className="staff-floating-chat-list-title">
                        <strong>{guestLabel(conversation.guest_identifier)}</strong>
                        <time>{formatTime(conversation.last_message_at)}</time>
                      </span>
                      <span className="staff-floating-chat-preview">
                        {conversation.last_sender_type === "staff" ? `${conversation.last_sender_name || "Petugas"}: ` : ""}
                        {conversation.last_message || "Percakapan baru"}
                      </span>
                      <small>{conversation.total_messages} pesan</small>
                    </span>
                    {conversation.unread_count > 0 ? (
                      <i className="staff-floating-chat-unread-badge" aria-label={`${conversation.unread_count} pesan belum dibaca`}>
                        {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
                      </i>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

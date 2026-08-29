import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { createNumeric, dbNow, getAll, getById, getTableMap, setByKey, updateById, type DbRecord } from "@/lib/realtime-db";

const MAX_MESSAGE_LENGTH = 2000;

type ConversationRow = DbRecord & { id: number; guest_identifier: string; status: "open" | "closed"; created_at: string; last_message_at: string };
type MessageRow = DbRecord & { id: number; conversation_id: number; sender_type: "guest" | "staff"; sender_user_id: number | null; sender_name_snapshot: string | null; message: string; created_at: string };

async function requireStaff(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !["admin", "pengguna"].includes(user.role)) return null;
  return user;
}
function normalizeMessage(value: unknown) {
  const message = String(value ?? "").replace(/\r\n/g, "\n").trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH) return null;
  return message;
}
function readKey(conversationId: number, userId: number) { return `${conversationId}_${userId}`; }

export async function GET(request: NextRequest) {
  const user = await requireStaff(request);
  if (!user) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const conversationId = Number(request.nextUrl.searchParams.get("conversation_id") ?? 0);
    const [conversations, messages] = await Promise.all([getAll<ConversationRow>("chat_conversations"), getAll<MessageRow>("chat_messages")]);
    if (conversationId > 0) {
      const conversation = conversations.find((row) => Number(row.id) === conversationId);
      if (!conversation) return NextResponse.json({ message: "Percakapan tidak ditemukan." }, { status: 404 });
      const selected = messages.filter((row) => Number(row.conversation_id) === conversationId).sort((a, b) => Number(a.id) - Number(b.id));
      return NextResponse.json({ data: { conversation, messages: selected } });
    }

    const reads = await getTableMap("chat_staff_reads");
    const grouped = new Map<number, MessageRow[]>();
    for (const message of messages) {
      const id = Number(message.conversation_id);
      const bucket = grouped.get(id) ?? [];
      bucket.push(message);
      grouped.set(id, bucket);
    }
    const rows = conversations.map((conversation) => {
      const bucket = (grouped.get(Number(conversation.id)) ?? []).sort((a, b) => Number(a.id) - Number(b.id));
      const last = bucket.at(-1) ?? null;
      const read = reads[readKey(Number(conversation.id), user.id)] as DbRecord | undefined;
      const lastRead = Number(read?.last_read_message_id ?? 0);
      return {
        ...conversation,
        last_message_id: last ? Number(last.id) : null,
        last_message: last?.message ?? null,
        last_sender_type: last?.sender_type ?? null,
        last_sender_name: last?.sender_name_snapshot ?? null,
        total_messages: bucket.length,
        unread_count: bucket.filter((m) => m.sender_type === "guest" && Number(m.id) > lastRead).length,
      };
    }).sort((a, b) => String(b.last_message_at ?? "").localeCompare(String(a.last_message_at ?? "")) || Number(b.id) - Number(a.id));
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[chat/staff GET]", error);
    return NextResponse.json({ message: "Data chat belum dapat dimuat." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await requireStaff(request);
  if (!user) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const body = await request.json();
    const conversationId = Number(body.conversation_id ?? 0);
    const requestedReadId = Number(body.last_read_message_id ?? 0);
    if (!conversationId || !requestedReadId) return NextResponse.json({ message: "Status baca tidak valid." }, { status: 400 });
    const conversation = await getById("chat_conversations", conversationId);
    if (!conversation) return NextResponse.json({ message: "Percakapan tidak ditemukan." }, { status: 404 });
    const messages = (await getAll<MessageRow>("chat_messages")).filter((row) => Number(row.conversation_id) === conversationId && Number(row.id) <= requestedReadId);
    const lastReadMessageId = messages.reduce((max, row) => Math.max(max, Number(row.id)), 0);
    if (!lastReadMessageId) return NextResponse.json({ data: { conversation_id: conversationId, unread_count: 0 } });

    const key = readKey(conversationId, user.id);
    const existing = (await getTableMap("chat_staff_reads"))[key] as DbRecord | undefined;
    const finalId = Math.max(lastReadMessageId, Number(existing?.last_read_message_id ?? 0));
    await setByKey("chat_staff_reads", key, { conversation_id: conversationId, user_id: user.id, last_read_message_id: finalId, last_read_at: dbNow() });
    return NextResponse.json({ data: { conversation_id: conversationId, last_read_message_id: finalId, unread_count: 0 } });
  } catch (error) {
    console.error("[chat/staff PATCH]", error);
    return NextResponse.json({ message: "Status baca belum dapat diperbarui." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await requireStaff(request);
  if (!user) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const body = await request.json();
    const conversationId = Number(body.conversation_id ?? 0);
    const message = normalizeMessage(body.message);
    if (!conversationId) return NextResponse.json({ message: "Percakapan tidak valid." }, { status: 400 });
    if (!message) return NextResponse.json({ message: `Pesan wajib diisi dan maksimal ${MAX_MESSAGE_LENGTH} karakter.` }, { status: 400 });
    if (!(await getById("chat_conversations", conversationId))) return NextResponse.json({ message: "Percakapan tidak ditemukan." }, { status: 404 });
    const id = await createNumeric("chat_messages", { conversation_id: conversationId, sender_type: "staff", sender_user_id: user.id, sender_name_snapshot: user.name, message });
    await updateById("chat_conversations", conversationId, { status: "open", last_message_at: dbNow() });
    return NextResponse.json({ data: { id, conversation_id: conversationId, sender_type: "staff", sender_user_id: user.id, sender_name_snapshot: user.name, message } }, { status: 201 });
  } catch (error) {
    console.error("[chat/staff POST]", error);
    return NextResponse.json({ message: "Balasan belum dapat dikirim." }, { status: 500 });
  }
}

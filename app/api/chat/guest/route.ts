import { NextRequest, NextResponse } from "next/server";
import { createNumeric, dbNow, findOne, getAll, updateById, type DbRecord } from "@/lib/realtime-db";

const GUEST_ID_RE = /^[a-zA-Z0-9_-]{20,80}$/;
const MAX_MESSAGE_LENGTH = 2000;

type ConversationRow = DbRecord & {
  id: number;
  guest_identifier: string;
  status: "open" | "closed";
  created_at: string;
  last_message_at: string;
};

type MessageRow = DbRecord & {
  id: number;
  conversation_id: number;
  sender_type: "guest" | "staff";
  sender_user_id: number | null;
  sender_name_snapshot: string | null;
  message: string;
  created_at: string;
};

function readGuestId(value: unknown) {
  const guestId = String(value ?? "").trim();
  return GUEST_ID_RE.test(guestId) ? guestId : null;
}
function normalizeMessage(value: unknown) {
  const message = String(value ?? "").replace(/\r\n/g, "\n").trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH) return null;
  return message;
}
async function getConversation(guestId: string) {
  return findOne<ConversationRow>("chat_conversations", (row) => row.guest_identifier === guestId);
}
async function getMessages(conversationId: number) {
  return (await getAll<MessageRow>("chat_messages"))
    .filter((row) => Number(row.conversation_id) === conversationId)
    .sort((a, b) => Number(a.id) - Number(b.id));
}

export async function GET(request: NextRequest) {
  try {
    const guestId = readGuestId(request.nextUrl.searchParams.get("guest_id"));
    if (!guestId) return NextResponse.json({ message: "Identifier guest tidak valid." }, { status: 400 });
    const conversation = await getConversation(guestId);
    if (!conversation) return NextResponse.json({ data: { conversation: null, messages: [] } });
    return NextResponse.json({ data: { conversation, messages: await getMessages(conversation.id) } });
  } catch (error) {
    console.error("[chat/guest GET]", error);
    return NextResponse.json({ message: "Percakapan belum dapat dimuat." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const guestId = readGuestId(body.guest_id);
    const message = normalizeMessage(body.message);
    if (!guestId) return NextResponse.json({ message: "Identifier guest tidak valid." }, { status: 400 });
    if (!message) return NextResponse.json({ message: `Pesan wajib diisi dan maksimal ${MAX_MESSAGE_LENGTH} karakter.` }, { status: 400 });

    const now = dbNow();
    let conversation = await getConversation(guestId);
    let conversationId: number;
    if (conversation) {
      conversationId = Number(conversation.id);
      await updateById("chat_conversations", conversationId, { status: "open", last_message_at: now });
    } else {
      conversationId = await createNumeric("chat_conversations", { guest_identifier: guestId, status: "open", last_message_at: now });
      conversation = await getConversation(guestId);
    }

    const id = await createNumeric("chat_messages", {
      conversation_id: conversationId,
      sender_type: "guest",
      sender_user_id: null,
      sender_name_snapshot: null,
      message,
    });
    await updateById("chat_conversations", conversationId, { last_message_at: now, status: "open" });

    return NextResponse.json({ data: { id, conversation_id: conversationId, sender_type: "guest", sender_user_id: null, sender_name_snapshot: null, message } }, { status: 201 });
  } catch (error) {
    console.error("[chat/guest POST]", error);
    return NextResponse.json({ message: "Pesan belum dapat dikirim." }, { status: 500 });
  }
}

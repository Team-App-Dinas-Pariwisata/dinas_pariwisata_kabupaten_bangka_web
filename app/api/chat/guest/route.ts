import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const GUEST_ID_RE = /^[a-zA-Z0-9_-]{20,80}$/;
const MAX_MESSAGE_LENGTH = 2000;

type ConversationRow = RowDataPacket & {
  id: number;
  guest_identifier: string;
  status: "open" | "closed";
  created_at: string;
  last_message_at: string;
};

type MessageRow = RowDataPacket & {
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
  const [rows] = await db().execute<ConversationRow[]>(
    `SELECT id, guest_identifier, status, created_at, last_message_at
     FROM chat_conversations
     WHERE guest_identifier = ?
     LIMIT 1`,
    [guestId],
  );
  return rows[0] ?? null;
}

async function getMessages(conversationId: number) {
  const [rows] = await db().execute<MessageRow[]>(
    `SELECT id, conversation_id, sender_type, sender_user_id, sender_name_snapshot, message, created_at
     FROM chat_messages
     WHERE conversation_id = ?
     ORDER BY id ASC`,
    [conversationId],
  );
  return rows;
}

export async function GET(request: NextRequest) {
  try {
    const guestId = readGuestId(request.nextUrl.searchParams.get("guest_id"));
    if (!guestId) return NextResponse.json({ message: "Identifier guest tidak valid." }, { status: 400 });

    const conversation = await getConversation(guestId);
    if (!conversation) return NextResponse.json({ data: { conversation: null, messages: [] } });

    const messages = await getMessages(conversation.id);
    return NextResponse.json({ data: { conversation, messages } });
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

    const [conversationResult] = await db().execute<ResultSetHeader>(
      `INSERT INTO chat_conversations (guest_identifier, status, last_message_at)
       VALUES (?, 'open', CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), status = 'open', last_message_at = CURRENT_TIMESTAMP`,
      [guestId],
    );
    const conversationId = Number(conversationResult.insertId);

    const [messageResult] = await db().execute<ResultSetHeader>(
      `INSERT INTO chat_messages (conversation_id, sender_type, sender_user_id, sender_name_snapshot, message)
       VALUES (?, 'guest', NULL, NULL, ?)`,
      [conversationId, message],
    );

    await db().execute(
      `UPDATE chat_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [conversationId],
    );

    return NextResponse.json(
      {
        data: {
          id: Number(messageResult.insertId),
          conversation_id: conversationId,
          sender_type: "guest",
          sender_user_id: null,
          sender_name_snapshot: null,
          message,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[chat/guest POST]", error);
    return NextResponse.json({ message: "Pesan belum dapat dikirim." }, { status: 500 });
  }
}

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { db } from "@/lib/db";

const MAX_MESSAGE_LENGTH = 2000;

type ConversationListRow = RowDataPacket & {
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

type MaxMessageRow = RowDataPacket & {
  max_read_id: number | null;
};

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

export async function GET(request: NextRequest) {
  const user = await requireStaff(request);
  if (!user) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });

  try {
    const conversationId = Number(request.nextUrl.searchParams.get("conversation_id") ?? 0);
    if (conversationId > 0) {
      const [conversationRows] = await db().execute<ConversationRow[]>(
        `SELECT id, guest_identifier, status, created_at, last_message_at
         FROM chat_conversations
         WHERE id = ? LIMIT 1`,
        [conversationId],
      );
      const conversation = conversationRows[0];
      if (!conversation) return NextResponse.json({ message: "Percakapan tidak ditemukan." }, { status: 404 });

      const [messages] = await db().execute<MessageRow[]>(
        `SELECT id, conversation_id, sender_type, sender_user_id, sender_name_snapshot, message, created_at
         FROM chat_messages
         WHERE conversation_id = ?
         ORDER BY id ASC`,
        [conversationId],
      );
      return NextResponse.json({ data: { conversation, messages } });
    }

    const [rows] = await db().execute<ConversationListRow[]>(
      `SELECT
         c.id,
         c.guest_identifier,
         c.status,
         c.created_at,
         c.last_message_at,
         lm.id AS last_message_id,
         lm.message AS last_message,
         lm.sender_type AS last_sender_type,
         lm.sender_name_snapshot AS last_sender_name,
         (SELECT COUNT(*) FROM chat_messages cm WHERE cm.conversation_id = c.id) AS total_messages,
         (SELECT COUNT(*)
            FROM chat_messages unread
           WHERE unread.conversation_id = c.id
             AND unread.sender_type = 'guest'
             AND unread.id > COALESCE(sr.last_read_message_id, 0)) AS unread_count
       FROM chat_conversations c
       LEFT JOIN chat_messages lm
         ON lm.id = (SELECT MAX(cm2.id) FROM chat_messages cm2 WHERE cm2.conversation_id = c.id)
       LEFT JOIN chat_staff_reads sr
         ON sr.conversation_id = c.id AND sr.user_id = ?
       ORDER BY c.last_message_at DESC, c.id DESC`,
      [user.id],
    );
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

    if (!conversationId || !requestedReadId) {
      return NextResponse.json({ message: "Status baca tidak valid." }, { status: 400 });
    }

    const [conversationRows] = await db().execute<ConversationRow[]>(
      `SELECT id, guest_identifier, status, created_at, last_message_at
       FROM chat_conversations WHERE id = ? LIMIT 1`,
      [conversationId],
    );
    if (!conversationRows[0]) return NextResponse.json({ message: "Percakapan tidak ditemukan." }, { status: 404 });

    const [maxRows] = await db().execute<MaxMessageRow[]>(
      `SELECT MAX(id) AS max_read_id
       FROM chat_messages
       WHERE conversation_id = ? AND id <= ?`,
      [conversationId, requestedReadId],
    );
    const lastReadMessageId = Number(maxRows[0]?.max_read_id ?? 0);
    if (!lastReadMessageId) return NextResponse.json({ data: { conversation_id: conversationId, unread_count: 0 } });

    await db().execute(
      `INSERT INTO chat_staff_reads (conversation_id, user_id, last_read_message_id, last_read_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
         last_read_message_id = GREATEST(last_read_message_id, VALUES(last_read_message_id)),
         last_read_at = CURRENT_TIMESTAMP`,
      [conversationId, user.id, lastReadMessageId],
    );

    return NextResponse.json({
      data: {
        conversation_id: conversationId,
        last_read_message_id: lastReadMessageId,
        unread_count: 0,
      },
    });
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

    const [conversationRows] = await db().execute<ConversationRow[]>(
      `SELECT id, guest_identifier, status, created_at, last_message_at
       FROM chat_conversations WHERE id = ? LIMIT 1`,
      [conversationId],
    );
    if (!conversationRows[0]) return NextResponse.json({ message: "Percakapan tidak ditemukan." }, { status: 404 });

    const [result] = await db().execute<ResultSetHeader>(
      `INSERT INTO chat_messages (conversation_id, sender_type, sender_user_id, sender_name_snapshot, message)
       VALUES (?, 'staff', ?, ?, ?)`,
      [conversationId, user.id, user.name, message],
    );
    await db().execute(
      `UPDATE chat_conversations SET status = 'open', last_message_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [conversationId],
    );

    return NextResponse.json(
      {
        data: {
          id: Number(result.insertId),
          conversation_id: conversationId,
          sender_type: "staff",
          sender_user_id: user.id,
          sender_name_snapshot: user.name,
          message,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[chat/staff POST]", error);
    return NextResponse.json({ message: "Balasan belum dapat dikirim." }, { status: 500 });
  }
}

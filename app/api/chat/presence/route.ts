import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { dbNow, deleteByKey, getAll, setByKey, toTime, type DbRecord } from "@/lib/realtime-db";

const ONLINE_WINDOW_SECONDS = 75;

export async function GET() {
  try {
    const [presence, users] = await Promise.all([getAll("staff_chat_presence"), getAll("pengguna")]);
    const userMap = new Map(users.map((row) => [Number(row.id), row]));
    const threshold = Date.now() - ONLINE_WINDOW_SECONDS * 1000;
    const onlineIds = new Set<number>();
    for (const row of presence) {
      const userId = Number(row.user_id ?? row.id);
      const user = userMap.get(userId);
      if (!user || String(user.status) !== "active") continue;
      const role = String(user.role ?? "");
      if (!["super_admin", "admin", "operator", "verifikator", "pengguna"].includes(role)) continue;
      if (toTime(row.last_seen_at) >= threshold) onlineIds.add(userId);
    }
    return NextResponse.json({ data: { online_count: onlineIds.size, online_window_seconds: ONLINE_WINDOW_SECONDS } }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("[chat/presence GET]", error);
    return NextResponse.json({ data: { online_count: 0, online_window_seconds: ONLINE_WINDOW_SECONDS } }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !["admin", "pengguna"].includes(user.role)) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const now = dbNow();
    const record: DbRecord = { user_id: user.id, last_seen_at: now, updated_at: now };
    await setByKey("staff_chat_presence", user.id, record);
    return NextResponse.json({ data: { online: true } }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("[chat/presence POST]", error);
    return NextResponse.json({ message: "Status online petugas belum dapat diperbarui." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !["admin", "pengguna"].includes(user.role)) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    await deleteByKey("staff_chat_presence", user.id);
    return NextResponse.json({ data: { online: false } }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("[chat/presence DELETE]", error);
    return NextResponse.json({ message: "Status online petugas belum dapat diperbarui." }, { status: 500 });
  }
}

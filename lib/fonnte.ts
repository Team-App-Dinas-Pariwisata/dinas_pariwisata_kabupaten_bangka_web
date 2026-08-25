/**
 * Klien tipis untuk WhatsApp Gateway Fonnte (https://fonnte.com).
 *
 * Cara kerja: POST ke https://api.fonnte.com/send dengan header
 * `Authorization: <FONNTE_TOKEN>` (token device, didapat dari dashboard Fonnte)
 * dan body form-data berisi `target` (nomor tujuan) dan `message` (isi pesan).
 *
 * Dokumentasi resmi: https://docs.fonnte.com/api-send-message/
 */

const FONNTE_SEND_URL = "https://api.fonnte.com/send";
const REQUEST_TIMEOUT_MS = 15_000;

export type FonnteSendResult =
  | { ok: true; detail?: string; requestId?: string }
  | { ok: false; reason: string };

function fonnteToken(): string | null {
  const token = process.env.FONNTE_TOKEN?.trim();
  return token ? token : null;
}

/** true jika FONNTE_TOKEN sudah dikonfigurasi di environment. */
export function fonnteReady(): boolean {
  return Boolean(fonnteToken());
}

/**
 * Menormalkan nomor HP Indonesia ke format internasional tanpa "+"
 * (mis. 62812xxxxxxx) sesuai format yang diharapkan Fonnte.
 *
 * Menerima input umum seperti: "0812xxxxxxx", "812xxxxxxx",
 * "+62 812-xxxx-xxxx", "62812xxxxxxx", dsb.
 * Mengembalikan null jika nomor terlalu pendek/panjang untuk dianggap valid.
 */
export function normalizeIndonesianPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D+/g, "");
  if (!digits) return null;

  let normalized = digits;
  if (normalized.startsWith("620")) {
    // Kasus input seperti "620812xxxx" (62 + 0 + nomor lokal) -> buang nol berlebih.
    normalized = `62${normalized.slice(3)}`;
  } else if (normalized.startsWith("0")) {
    normalized = `62${normalized.slice(1)}`;
  } else if (normalized.startsWith("8")) {
    normalized = `62${normalized}`;
  } else if (!normalized.startsWith("62")) {
    normalized = digits;
  }

  if (normalized.length < 10 || normalized.length > 15) return null;
  return normalized;
}

/**
 * Mengirim satu pesan teks WhatsApp lewat Fonnte.
 * Fungsi ini tidak pernah melempar (throw) — kegagalan pengiriman dikembalikan
 * sebagai { ok: false, reason } agar pemanggil bisa memilih untuk sekadar
 * mencatat log tanpa menggagalkan alur utama (mis. proses verifikasi pengajuan).
 */
export async function sendWhatsAppMessage(targetPhone: string, message: string): Promise<FonnteSendResult> {
  const token = fonnteToken();
  if (!token) {
    return { ok: false, reason: "FONNTE_TOKEN belum dikonfigurasi di environment." };
  }

  const phone = normalizeIndonesianPhone(targetPhone);
  if (!phone) {
    return { ok: false, reason: `Nomor HP tidak valid untuk dikirimi WhatsApp: "${targetPhone}".` };
  }

  const body = new FormData();
  body.append("target", phone);
  body.append("message", message);
  // countryCode: Fonnte otomatis mengganti awalan "0" dengan kode negara ini.
  // Nomor sudah kita normalisasi ke 62xxxx di atas, tapi tetap dikirim untuk berjaga-jaga.
  body.append("countryCode", "62");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(FONNTE_SEND_URL, {
      method: "POST",
      headers: { Authorization: token },
      body,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null) as
      | { status?: boolean; detail?: string; reason?: string; requestid?: number | string }
      | null;

    if (!response.ok || !data || data.status !== true) {
      const reason = data?.reason || data?.detail || `HTTP ${response.status} dari Fonnte.`;
      return { ok: false, reason: String(reason) };
    }

    return {
      ok: true,
      detail: data.detail,
      requestId: data.requestid !== undefined ? String(data.requestid) : undefined,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, reason: "Waktu tunggu ke server Fonnte habis (timeout)." };
    }
    return { ok: false, reason: error instanceof Error ? error.message : "Gagal menghubungi Fonnte." };
  } finally {
    clearTimeout(timeout);
  }
}

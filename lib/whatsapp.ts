const REQUEST_TIMEOUT_MS = 30_000;
const FLAZHOST_DEFAULT_API_BASE_URL = "https://flazhost.com/api/wa/v1";
const MAX_RETRY_ATTEMPTS = 2;

export type WhatsAppProvider = "flazhost";

export type WhatsAppSendResult =
  | { ok: true; detail?: string; messageId?: string }
  | { ok: false; reason: string; status?: number; code?: string };

export type WhatsAppConnectionState =
  | "unconfigured"
  | "ready"
  | "disconnected"
  | "qr"
  | "error"
  | "stopped";

export type WhatsAppServiceStatus = {
  provider: WhatsAppProvider;
  providerLabel: string;
  supportsSessionControl: false;
  configured: boolean;
  state: WhatsAppConnectionState;
  ready: boolean;
  message: string;
  account: {
    wid: string | null;
    phone: string | null;
    name: string | null;
    platform: string | null;
  } | null;
  providerDetails: {
    deviceId: string | null;
    remoteStatus: string | null;
    apiBaseUrl: string;
  } | null;
  lastError: string | null;
};

type FlazHostConfig = {
  apiBaseUrl: string;
  apiKey: string;
  deviceId: string;
};

type FlazHostErrorResponse = {
  error?: string;
  message?: string;
};

type FlazHostDeviceStatusResponse = FlazHostErrorResponse & {
  status?: string;
};

type FlazHostSendResponse = FlazHostErrorResponse & {
  id?: string | number;
  message_id?: string | number;
  data?: {
    id?: string | number;
    message_id?: string | number;
  };
};

function flazHostConfig(): FlazHostConfig | null {
  const apiKey = process.env.FLAZHOST_WA_KEY?.trim();
  const deviceId = process.env.FLAZHOST_WA_DEVICE_ID?.trim();
  if (!apiKey || !deviceId) return null;

  const apiBaseUrl = (
    process.env.FLAZHOST_WA_BASE_URL?.trim() || FLAZHOST_DEFAULT_API_BASE_URL
  ).replace(/\/+$/, "");

  return { apiBaseUrl, apiKey, deviceId };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractErrorMessage(
  data: FlazHostErrorResponse | null,
  fallback: string,
): string {
  return data?.message || data?.error || fallback;
}

function extractMessageId(data: FlazHostSendResponse | null): string | undefined {
  const raw = data?.message_id ?? data?.id ?? data?.data?.message_id ?? data?.data?.id;
  return raw === undefined || raw === null ? undefined : String(raw);
}

/**
 * Menormalkan nomor WhatsApp Indonesia ke format E.164 tanpa tanda "+",
 * sesuai contoh FlazHost: 628123456789.
 */
export function normalizeIndonesianPhone(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D+/g, "");
  if (!digits) return null;

  let normalized = digits;
  if (normalized.startsWith("620")) {
    normalized = `62${normalized.slice(3)}`;
  } else if (normalized.startsWith("0")) {
    normalized = `62${normalized.slice(1)}`;
  } else if (normalized.startsWith("8")) {
    normalized = `62${normalized}`;
  }

  if (!normalized.startsWith("62")) return null;
  if (normalized.length < 10 || normalized.length > 15) return null;
  return normalized;
}

async function flazHostRequest<T extends FlazHostErrorResponse>(
  path: string,
  init: RequestInit = {},
  options: { retryTransient?: boolean } = {},
): Promise<{ response: Response; data: T | null }> {
  const config = flazHostConfig();
  if (!config) {
    throw new Error(
      "FLAZHOST_WA_KEY atau FLAZHOST_WA_DEVICE_ID belum dikonfigurasi.",
    );
  }

  const retryTransient = options.retryTransient === true;
  const attempts = retryTransient ? MAX_RETRY_ATTEMPTS + 1 : 1;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${config.apiBaseUrl}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...init.headers,
        },
        cache: "no-store",
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => null)) as T | null;

      // Dokumentasi FlazHost menyarankan retry/backoff untuk HTTP 429 dan 500.
      const transient = response.status === 429 || response.status === 500;
      if (!response.ok && retryTransient && transient && attempt < attempts - 1) {
        const waitMs = 1_000 * (2 ** attempt);
        clearTimeout(timeout);
        await sleep(waitMs);
        continue;
      }

      return { response, data };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        if (retryTransient && attempt < attempts - 1) {
          clearTimeout(timeout);
          await sleep(1_000 * (2 ** attempt));
          continue;
        }
        throw new Error("Waktu tunggu ke FlazHost WhatsApp Gateway habis.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("FlazHost WhatsApp Gateway tidak dapat dihubungi.");
}

function baseStatus(
  overrides: Partial<WhatsAppServiceStatus> = {},
): WhatsAppServiceStatus {
  const config = flazHostConfig();
  const apiBaseUrl = (
    process.env.FLAZHOST_WA_BASE_URL?.trim() || FLAZHOST_DEFAULT_API_BASE_URL
  ).replace(/\/+$/, "");

  return {
    provider: "flazhost",
    providerLabel: "FlazHost WhatsApp Gateway",
    supportsSessionControl: false,
    configured: Boolean(config),
    state: config ? "disconnected" : "unconfigured",
    ready: false,
    message: config
      ? "Memeriksa status perangkat FlazHost."
      : "FLAZHOST_WA_KEY atau FLAZHOST_WA_DEVICE_ID belum dikonfigurasi.",
    account: config
      ? {
          wid: config.deviceId,
          phone: null,
          name: "Perangkat FlazHost",
          platform: "FlazHost",
        }
      : null,
    providerDetails: {
      deviceId: config?.deviceId || null,
      remoteStatus: null,
      apiBaseUrl,
    },
    lastError: null,
    ...overrides,
  };
}

/** Membaca status perangkat dari GET /devices/:id/status. */
export async function getWhatsAppStatus(): Promise<WhatsAppServiceStatus> {
  const config = flazHostConfig();
  if (!config) return baseStatus();

  try {
    const { response, data } = await flazHostRequest<FlazHostDeviceStatusResponse>(
      `/devices/${encodeURIComponent(config.deviceId)}/status`,
      { method: "GET" },
    );

    if (!response.ok) {
      const reason = extractErrorMessage(
        data,
        `FlazHost merespons HTTP ${response.status}.`,
      );
      return baseStatus({
        configured: true,
        state: "error",
        ready: false,
        message: reason,
        providerDetails: {
          deviceId: config.deviceId,
          remoteStatus: null,
          apiBaseUrl: config.apiBaseUrl,
        },
        lastError: `${data?.error || `HTTP_${response.status}`}: ${reason}`,
      });
    }

    const remoteStatus = String(data?.status || "unknown").toLowerCase();
    const ready = remoteStatus === "connected";

    let state: WhatsAppConnectionState = "error";
    let message = `Status perangkat FlazHost: ${remoteStatus}.`;

    if (ready) {
      state = "ready";
      message = "Perangkat FlazHost terhubung dan siap mengirim notifikasi WhatsApp.";
    } else if (remoteStatus === "disconnected") {
      state = "disconnected";
      message = "Perangkat FlazHost terputus. Hubungkan kembali dari dashboard FlazHost.";
    } else if (remoteStatus === "qr_pending") {
      state = "qr";
      message = "Perangkat FlazHost menunggu pemindaian QR di dashboard FlazHost.";
    } else if (remoteStatus === "banned") {
      state = "stopped";
      message = "Perangkat FlazHost berstatus banned dan tidak dapat mengirim pesan.";
    }

    return baseStatus({
      configured: true,
      state,
      ready,
      message,
      providerDetails: {
        deviceId: config.deviceId,
        remoteStatus,
        apiBaseUrl: config.apiBaseUrl,
      },
      lastError: ready ? null : message,
    });
  } catch (error) {
    const reason = error instanceof Error
      ? error.message
      : "FlazHost WhatsApp Gateway tidak dapat dihubungi.";

    return baseStatus({
      configured: true,
      state: "error",
      ready: false,
      message: reason,
      providerDetails: {
        deviceId: config.deviceId,
        remoteStatus: null,
        apiBaseUrl: config.apiBaseUrl,
      },
      lastError: reason,
    });
  }
}

/**
 * Mengirim satu pesan teks melalui POST /messages/send.
 * Fungsi tidak melempar error agar kegagalan WhatsApp tidak menggagalkan transaksi utama.
 */
export async function sendWhatsAppMessage(
  targetPhone: string,
  message: string,
): Promise<WhatsAppSendResult> {
  const config = flazHostConfig();
  if (!config) {
    return {
      ok: false,
      reason: "FLAZHOST_WA_KEY atau FLAZHOST_WA_DEVICE_ID belum dikonfigurasi.",
    };
  }

  const phone = normalizeIndonesianPhone(targetPhone);
  if (!phone) {
    return {
      ok: false,
      reason: `Nomor WhatsApp tidak valid: "${targetPhone}". Gunakan nomor Indonesia yang aktif.`,
    };
  }

  const text = message.trim();
  if (!text) {
    return { ok: false, reason: "Isi pesan WhatsApp kosong." };
  }

  try {
    const { response, data } = await flazHostRequest<FlazHostSendResponse>(
      "/messages/send",
      {
        method: "POST",
        body: JSON.stringify({
          device_id: config.deviceId,
          to: phone,
          text,
        }),
      },
      { retryTransient: true },
    );

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        code: data?.error,
        reason: extractErrorMessage(
          data,
          `FlazHost merespons HTTP ${response.status}.`,
        ),
      };
    }

    return {
      ok: true,
      detail: "Pesan diterima oleh FlazHost WhatsApp Gateway.",
      messageId: extractMessageId(data),
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error
        ? error.message
        : "Gagal menghubungi FlazHost WhatsApp Gateway.",
    };
  }
}

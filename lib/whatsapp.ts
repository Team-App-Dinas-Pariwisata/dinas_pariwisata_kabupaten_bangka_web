const REQUEST_TIMEOUT_MS = 30_000;

export type WhatsAppSendResult =
  | { ok: true; detail?: string; messageId?: string }
  | { ok: false; reason: string };

export type WhatsAppConnectionState =
  | "unconfigured"
  | "idle"
  | "starting"
  | "qr"
  | "authenticated"
  | "ready"
  | "disconnected"
  | "auth_failure"
  | "error"
  | "stopped";

export type WhatsAppServiceStatus = {
  configured: boolean;
  state: WhatsAppConnectionState;
  ready: boolean;
  message: string;
  qrDataUrl: string | null;
  qrGeneratedAt: string | null;
  account: {
    wid: string | null;
    phone: string | null;
    name: string | null;
    platform: string | null;
  } | null;
  lastEventAt: string | null;
  lastReadyAt: string | null;
  lastError: string | null;
  reconnectAttempt: number;
};

type ServiceResponse<T> = {
  ok?: boolean;
  message?: string;
  status?: T;
  messageId?: string;
};

function serviceConfig(): { baseUrl: string; apiKey: string } | null {
  const baseUrl = process.env.WA_SERVICE_URL?.trim().replace(/\/+$/, "");
  const apiKey = process.env.WA_SERVICE_API_KEY?.trim();
  if (!baseUrl || !apiKey) return null;
  return { baseUrl, apiKey };
}

function unconfiguredStatus(): WhatsAppServiceStatus {
  return {
    configured: false,
    state: "unconfigured",
    ready: false,
    message: "WA_SERVICE_URL atau WA_SERVICE_API_KEY belum dikonfigurasi.",
    qrDataUrl: null,
    qrGeneratedAt: null,
    account: null,
    lastEventAt: null,
    lastReadyAt: null,
    lastError: null,
    reconnectAttempt: 0,
  };
}

async function requestService<T>(path: string, init?: RequestInit): Promise<T> {
  const config = serviceConfig();
  if (!config) throw new Error("Service WhatsApp belum dikonfigurasi.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as ServiceResponse<T> | null;
    if (!response.ok) {
      throw new Error(data?.message || `Service WhatsApp merespons HTTP ${response.status}.`);
    }
    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Waktu tunggu ke service WhatsApp habis.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getWhatsAppStatus(): Promise<WhatsAppServiceStatus> {
  if (!serviceConfig()) return unconfiguredStatus();

  const data = await requestService<{ status: WhatsAppServiceStatus }>("/api/status");
  return { ...data.status, configured: true };
}

export async function controlWhatsApp(
  action: "restart" | "reset",
): Promise<WhatsAppServiceStatus> {
  const path = action === "reset" ? "/api/session/reset" : "/api/restart";
  const data = await requestService<{ status: WhatsAppServiceStatus }>(path, {
    method: "POST",
    body: JSON.stringify(action === "reset" ? { confirmation: "RESET" } : {}),
  });
  return { ...data.status, configured: true };
}

/**
 * Mengirim satu pesan melalui service whatsapp-web.js di Railway.
 * Fungsi ini tidak melempar agar kegagalan WhatsApp tetap dapat di-fallback ke email.
 */
export async function sendWhatsAppMessage(
  targetPhone: string,
  message: string,
): Promise<WhatsAppSendResult> {
  if (!serviceConfig()) {
    return { ok: false, reason: "Service WhatsApp belum dikonfigurasi." };
  }

  try {
    const data = await requestService<{ ok: boolean; message?: string; messageId?: string }>(
      "/api/send",
      {
        method: "POST",
        body: JSON.stringify({ phone: targetPhone, message }),
      },
    );

    return {
      ok: true,
      detail: data.message,
      messageId: data.messageId,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Gagal menghubungi service WhatsApp.",
    };
  }
}

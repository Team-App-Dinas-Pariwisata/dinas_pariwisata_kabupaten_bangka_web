const REQUEST_TIMEOUT_MS = 30_000;
const FONNTE_DEFAULT_API_BASE_URL = "https://api.fonnte.com";

export type WhatsAppProvider = "webjs" | "fonnte";

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
  provider: WhatsAppProvider;
  providerLabel: string;
  supportsSessionControl: boolean;
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
  providerDetails: {
    packageName: string | null;
    quota: string | null;
    expired: string | null;
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

type FonnteResponseBase = {
  status?: boolean;
  Status?: boolean;
  reason?: string;
  detail?: string;
  requestid?: string | number;
};

type FonnteDeviceResponse = FonnteResponseBase & {
  device?: string;
  device_status?: string;
  expired?: string;
  messages?: number;
  name?: string;
  package?: string;
  quota?: string | number;
};

type FonnteSendResponse = FonnteResponseBase & {
  id?: Array<string | number> | string | number;
  process?: string;
  target?: string[];
};

function providerLabel(provider: WhatsAppProvider): string {
  return provider === "fonnte" ? "Fonnte" : "Node.js (whatsapp-web.js)";
}

/**
 * Provider dipilih dari environment tanpa perlu mengubah source code.
 * Alias "fonte" dan "nodejs" diterima untuk memudahkan konfigurasi lama.
 */
export function getWhatsAppProvider(): WhatsAppProvider {
  const value = (process.env.WHATSAPP_PROVIDER || process.env.WA_PROVIDER || "webjs")
    .trim()
    .toLowerCase();

  if (["webjs", "nodejs", "whatsapp-webjs", "whatsapp-web.js"].includes(value)) {
    return "webjs";
  }
  if (["fonnte", "fonte"].includes(value)) return "fonnte";

  throw new Error(
    `WHATSAPP_PROVIDER tidak valid: "${value}". Gunakan "webjs" atau "fonnte".`,
  );
}

function webJsConfig(): { baseUrl: string; apiKey: string } | null {
  const baseUrl = process.env.WA_SERVICE_URL?.trim().replace(/\/+$/, "");
  const apiKey = process.env.WA_SERVICE_API_KEY?.trim();
  if (!baseUrl || !apiKey) return null;
  return { baseUrl, apiKey };
}

function fonnteConfig(): { apiBaseUrl: string; token: string; countryCode: string } | null {
  const token = process.env.FONNTE_TOKEN?.trim();
  if (!token) return null;

  const apiBaseUrl = (
    process.env.FONNTE_API_BASE_URL?.trim() || FONNTE_DEFAULT_API_BASE_URL
  ).replace(/\/+$/, "");
  const countryCode = process.env.FONNTE_COUNTRY_CODE?.trim() || "62";
  return { apiBaseUrl, token, countryCode };
}

function baseStatus(
  provider: WhatsAppProvider,
  overrides: Partial<WhatsAppServiceStatus> = {},
): WhatsAppServiceStatus {
  return {
    provider,
    providerLabel: providerLabel(provider),
    supportsSessionControl: provider === "webjs",
    configured: false,
    state: "unconfigured",
    ready: false,
    message: provider === "fonnte"
      ? "FONNTE_TOKEN belum dikonfigurasi."
      : "WA_SERVICE_URL atau WA_SERVICE_API_KEY belum dikonfigurasi.",
    qrDataUrl: null,
    qrGeneratedAt: null,
    account: null,
    providerDetails: null,
    lastEventAt: null,
    lastReadyAt: null,
    lastError: null,
    reconnectAttempt: 0,
    ...overrides,
  };
}

async function requestWebJsService<T>(path: string, init?: RequestInit): Promise<T> {
  const config = webJsConfig();
  if (!config) throw new Error("Service WhatsApp Node.js belum dikonfigurasi.");

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
      throw new Error("Waktu tunggu ke service WhatsApp Node.js habis.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestFonnte<T extends FonnteResponseBase>(
  path: string,
  body?: FormData,
): Promise<T> {
  const config = fonnteConfig();
  if (!config) throw new Error("FONNTE_TOKEN belum dikonfigurasi.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.apiBaseUrl}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: config.token,
      },
      body,
      cache: "no-store",
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as T | null;
    if (!response.ok || !data) {
      throw new Error(
        data?.reason || data?.detail || `Fonnte merespons HTTP ${response.status}.`,
      );
    }
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Waktu tunggu ke Fonnte habis.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function fonnteSucceeded(data: FonnteResponseBase): boolean {
  return data.status === true || data.Status === true;
}

function firstMessageId(data: FonnteSendResponse): string | undefined {
  const rawId = Array.isArray(data.id) ? data.id[0] : data.id;
  if (rawId !== undefined && rawId !== null) return String(rawId);
  if (data.requestid !== undefined && data.requestid !== null) return String(data.requestid);
  return undefined;
}

type WebJsStatus = Omit<
  WhatsAppServiceStatus,
  "provider" | "providerLabel" | "supportsSessionControl" | "providerDetails"
>;

function withWebJsProvider(status: WebJsStatus): WhatsAppServiceStatus {
  return {
    ...baseStatus("webjs"),
    ...status,
    provider: "webjs",
    providerLabel: providerLabel("webjs"),
    supportsSessionControl: true,
    configured: true,
    providerDetails: null,
  };
}

async function getWebJsStatus(): Promise<WhatsAppServiceStatus> {
  if (!webJsConfig()) return baseStatus("webjs");

  const data = await requestWebJsService<{ status: WebJsStatus }>("/api/status");
  return withWebJsProvider(data.status);
}

async function getFonnteStatus(): Promise<WhatsAppServiceStatus> {
  if (!fonnteConfig()) return baseStatus("fonnte");

  const data = await requestFonnte<FonnteDeviceResponse>("/device");
  if (!fonnteSucceeded(data)) {
    throw new Error(data.reason || "Fonnte menolak token atau gagal membaca status perangkat.");
  }

  const connected = data.device_status?.toLowerCase() === "connect";
  const device = data.device ? String(data.device) : null;
  return baseStatus("fonnte", {
    configured: true,
    state: connected ? "ready" : "disconnected",
    ready: connected,
    message: connected
      ? "Perangkat Fonnte terhubung dan siap mengirim notifikasi."
      : "Perangkat Fonnte belum terhubung. Hubungkan melalui dashboard Fonnte.",
    account: {
      wid: device,
      phone: device,
      name: data.name || "Perangkat Fonnte",
      platform: "Fonnte",
    },
    providerDetails: {
      packageName: data.package ? String(data.package) : null,
      quota: data.quota !== undefined && data.quota !== null ? String(data.quota) : null,
      expired: data.expired ? String(data.expired) : null,
    },
    lastError: connected ? null : "Status perangkat Fonnte: disconnect",
  });
}

export async function getWhatsAppStatus(): Promise<WhatsAppServiceStatus> {
  return getWhatsAppProvider() === "fonnte" ? getFonnteStatus() : getWebJsStatus();
}

export async function controlWhatsApp(
  action: "restart" | "reset",
): Promise<WhatsAppServiceStatus> {
  if (getWhatsAppProvider() !== "webjs") {
    throw new Error(
      "Restart dan reset QR hanya tersedia untuk provider Node.js (whatsapp-web.js).",
    );
  }

  const path = action === "reset" ? "/api/session/reset" : "/api/restart";
  const data = await requestWebJsService<{ status: WebJsStatus }>(path, {
    method: "POST",
    body: JSON.stringify(action === "reset" ? { confirmation: "RESET" } : {}),
  });
  return withWebJsProvider(data.status);
}

async function sendViaWebJs(
  targetPhone: string,
  message: string,
): Promise<WhatsAppSendResult> {
  if (!webJsConfig()) {
    return { ok: false, reason: "Service WhatsApp Node.js belum dikonfigurasi." };
  }

  try {
    const data = await requestWebJsService<{
      ok: boolean;
      message?: string;
      messageId?: string;
    }>("/api/send", {
      method: "POST",
      body: JSON.stringify({ phone: targetPhone, message }),
    });

    return { ok: true, detail: data.message, messageId: data.messageId };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error
        ? error.message
        : "Gagal menghubungi service WhatsApp Node.js.",
    };
  }
}

async function sendViaFonnte(
  targetPhone: string,
  message: string,
): Promise<WhatsAppSendResult> {
  const config = fonnteConfig();
  if (!config) return { ok: false, reason: "FONNTE_TOKEN belum dikonfigurasi." };

  try {
    const body = new FormData();
    body.append("target", targetPhone);
    body.append("message", message);
    body.append("countryCode", config.countryCode);
    body.append("connectOnly", "true");

    const data = await requestFonnte<FonnteSendResponse>("/send", body);
    if (!fonnteSucceeded(data)) {
      return {
        ok: false,
        reason: data.reason || data.detail || "Fonnte gagal memproses pesan.",
      };
    }

    return {
      ok: true,
      detail: data.detail || "Pesan diterima oleh antrean Fonnte.",
      messageId: firstMessageId(data),
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Gagal menghubungi Fonnte.",
    };
  }
}

/** Mengirim pesan menggunakan provider yang dipilih melalui WHATSAPP_PROVIDER. */
export async function sendWhatsAppMessage(
  targetPhone: string,
  message: string,
): Promise<WhatsAppSendResult> {
  try {
    return getWhatsAppProvider() === "fonnte"
      ? await sendViaFonnte(targetPhone, message)
      : await sendViaWebJs(targetPhone, message);
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Provider WhatsApp tidak valid.",
    };
  }
}

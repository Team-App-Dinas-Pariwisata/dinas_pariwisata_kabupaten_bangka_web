"use strict";

require("dotenv").config({ quiet: true });

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const express = require("express");
const QRCode = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");

const RUNNING_ON_RAILWAY = Boolean(
  process.env.RAILWAY_ENVIRONMENT_ID || process.env.RAILWAY_SERVICE_ID,
);
const RUNTIME_MODE = RUNNING_ON_RAILWAY
  ? "railway"
  : (process.env.WA_RUNTIME_MODE?.trim() || "local");
const PORT = positiveInteger(process.env.PORT, RUNNING_ON_RAILWAY ? 3000 : 3001);
const HOST = process.env.HOST?.trim() || "0.0.0.0";
const API_KEY = process.env.WA_SERVICE_API_KEY?.trim() || "";
const CLIENT_ID = sanitizeClientId(process.env.WA_CLIENT_ID || "siparik");
const DEFAULT_COUNTRY_CODE = digitsOnly(process.env.WA_DEFAULT_COUNTRY_CODE || "62");
const DEFAULT_SESSION_BASE_PATH = RUNNING_ON_RAILWAY
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH?.trim() || "/data", ".wwebjs_auth")
  : path.join(__dirname, ".wwebjs_auth");
const SESSION_BASE_PATH = path.resolve(
  process.env.WA_SESSION_PATH?.trim() || DEFAULT_SESSION_BASE_PATH,
);
const CHROMIUM_PATH = process.env.PUPPETEER_EXECUTABLE_PATH?.trim() || undefined;
const RECONNECT_BASE_MS = positiveInteger(process.env.WA_RECONNECT_BASE_MS, 5_000);
const RECONNECT_MAX_MS = positiveInteger(process.env.WA_RECONNECT_MAX_MS, 60_000);
const MAX_MESSAGE_LENGTH = positiveInteger(process.env.WA_MAX_MESSAGE_LENGTH, 4_096);
const AUTO_START = process.env.WA_AUTO_START !== "false";
const PRINT_QR_TERMINAL = process.env.WA_PRINT_QR_TERMINAL === "true"
  || (!RUNNING_ON_RAILWAY && process.env.WA_PRINT_QR_TERMINAL !== "false");

if (API_KEY.length < 32) {
  console.error("[startup] WA_SERVICE_API_KEY wajib diisi minimal 32 karakter.");
  process.exit(1);
}

if (!DEFAULT_COUNTRY_CODE || DEFAULT_COUNTRY_CODE.length > 4) {
  console.error("[startup] WA_DEFAULT_COUNTRY_CODE tidak valid.");
  process.exit(1);
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

class WhatsAppManager {
  constructor() {
    this.client = null;
    this.state = "idle";
    this.qrDataUrl = null;
    this.qrGeneratedAt = null;
    this.account = null;
    this.lastEventAt = new Date().toISOString();
    this.lastReadyAt = null;
    this.lastError = null;
    this.reconnectAttempt = 0;
    this.restartTimer = null;
    this.stopping = false;
    this.operationQueue = Promise.resolve();
    this.sendQueue = Promise.resolve();
    this.generation = 0;
  }

  status() {
    return {
      configured: true,
      state: this.state,
      ready: this.state === "ready" && Boolean(this.client),
      message: stateMessage(this.state),
      qrDataUrl: this.state === "qr" ? this.qrDataUrl : null,
      qrGeneratedAt: this.state === "qr" ? this.qrGeneratedAt : null,
      account: this.account,
      lastEventAt: this.lastEventAt,
      lastReadyAt: this.lastReadyAt,
      lastError: this.lastError,
      reconnectAttempt: this.reconnectAttempt,
    };
  }

  start(force = false) {
    return this.#exclusive(() => this.#startUnlocked(force));
  }

  restart() {
    return this.#exclusive(() => this.#startUnlocked(true));
  }

  resetSession() {
    return this.#exclusive(async () => {
      this.#clearRestartTimer();
      this.stopping = true;
      await this.#destroyCurrentClient(true);
      await this.#removeSessionDirectory();
      this.stopping = false;
      this.reconnectAttempt = 0;
      this.lastError = null;
      return this.#startUnlocked(true);
    });
  }

  stop() {
    return this.#exclusive(async () => {
      this.stopping = true;
      this.#clearRestartTimer();
      await this.#destroyCurrentClient(false);
      this.#setState("stopped");
      return this.status();
    });
  }

  send(phone, message) {
    const job = this.sendQueue.then(async () => {
      const client = this.client;
      if (!client || this.state !== "ready") {
        throw new HttpError(503, "WhatsApp belum terhubung. Buka halaman QR pada akun admin.");
      }

      const normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone) {
        throw new HttpError(400, "Nomor WhatsApp tidak valid.");
      }

      const text = typeof message === "string" ? message.trim() : "";
      if (!text) throw new HttpError(400, "Isi pesan tidak boleh kosong.");
      if (text.length > MAX_MESSAGE_LENGTH) {
        throw new HttpError(400, `Isi pesan maksimal ${MAX_MESSAGE_LENGTH} karakter.`);
      }

      let numberId;
      try {
        numberId = await client.getNumberId(normalizedPhone);
      } catch (error) {
        throw new HttpError(502, `Gagal memeriksa nomor tujuan: ${safeError(error)}`);
      }

      if (!numberId?._serialized) {
        throw new HttpError(422, "Nomor tujuan tidak terdaftar di WhatsApp.");
      }

      try {
        const sent = await client.sendMessage(numberId._serialized, text);
        return {
          messageId: sent?.id?._serialized || null,
          phone: normalizedPhone,
        };
      } catch (error) {
        throw new HttpError(502, `WhatsApp gagal mengirim pesan: ${safeError(error)}`);
      }
    });

    this.sendQueue = job.catch(() => undefined);
    return job;
  }

  #exclusive(action) {
    const operation = this.operationQueue.then(action, action);
    this.operationQueue = operation.catch(() => undefined);
    return operation;
  }

  async #startUnlocked(force) {
    if (!force && this.client && ["starting", "qr", "authenticated", "ready"].includes(this.state)) {
      return this.status();
    }

    this.stopping = false;
    this.#clearRestartTimer();
    await this.#destroyCurrentClient(false);
    await fs.mkdir(SESSION_BASE_PATH, { recursive: true });

    this.generation += 1;
    const generation = this.generation;
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: CLIENT_ID,
        dataPath: SESSION_BASE_PATH,
      }),
      puppeteer: {
        headless: true,
        executablePath: CHROMIUM_PATH,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--no-first-run",
          "--no-default-browser-check",
        ],
      },
    });

    this.client = client;
    this.qrDataUrl = null;
    this.qrGeneratedAt = null;
    this.account = null;
    this.lastError = null;
    this.#setState("starting");
    this.#bindClientEvents(client, generation);

    void client.initialize().catch(async (error) => {
      if (!this.#isCurrent(client, generation) || this.stopping) return;
      this.lastError = safeError(error);
      this.#setState("error");
      console.error(`[whatsapp] Inisialisasi gagal: ${this.lastError}`);
      await this.#destroySpecificClient(client);
      if (this.client === client) this.client = null;
      this.#scheduleRestart();
    });

    return this.status();
  }

  #bindClientEvents(client, generation) {
    client.on("qr", async (qr) => {
      if (!this.#isCurrent(client, generation) || this.stopping) return;
      try {
        if (PRINT_QR_TERMINAL) {
          void QRCode.toString(qr, { type: "terminal" })
            .then((terminalQr) => {
              console.log("[whatsapp] Pindai QR berikut dari WhatsApp > Perangkat tertaut:");
              console.log(terminalQr);
            })
            .catch((error) => {
              console.warn(`[whatsapp] QR terminal gagal ditampilkan: ${safeError(error)}`);
            });
        }
        const dataUrl = await QRCode.toDataURL(qr, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 360,
        });
        if (!this.#isCurrent(client, generation) || this.stopping) return;
        this.qrDataUrl = dataUrl;
        this.qrGeneratedAt = new Date().toISOString();
        this.#setState("qr");
        console.log("[whatsapp] QR baru tersedia untuk dipindai oleh admin.");
      } catch (error) {
        this.lastError = `QR gagal dibuat: ${safeError(error)}`;
        this.#setState("error");
      }
    });

    client.on("authenticated", () => {
      if (!this.#isCurrent(client, generation) || this.stopping) return;
      this.qrDataUrl = null;
      this.qrGeneratedAt = null;
      this.#setState("authenticated");
      console.log("[whatsapp] Autentikasi berhasil, menunggu client siap.");
    });

    client.on("ready", () => {
      if (!this.#isCurrent(client, generation) || this.stopping) return;
      this.qrDataUrl = null;
      this.qrGeneratedAt = null;
      this.reconnectAttempt = 0;
      this.lastError = null;
      this.lastReadyAt = new Date().toISOString();
      this.account = accountFromClient(client);
      this.#setState("ready");
      console.log(`[whatsapp] Client siap${this.account?.phone ? ` untuk ${maskPhone(this.account.phone)}` : ""}.`);
    });

    client.on("auth_failure", (message) => {
      if (!this.#isCurrent(client, generation) || this.stopping) return;
      this.lastError = String(message || "Sesi WhatsApp ditolak.");
      this.qrDataUrl = null;
      this.qrGeneratedAt = null;
      this.#setState("auth_failure");
      console.error(`[whatsapp] Autentikasi gagal: ${this.lastError}`);
    });

    client.on("disconnected", (reason) => {
      if (!this.#isCurrent(client, generation) || this.stopping) return;
      this.lastError = reason ? `Terputus: ${String(reason)}` : "Koneksi WhatsApp terputus.";
      this.account = null;
      this.qrDataUrl = null;
      this.qrGeneratedAt = null;
      this.#setState("disconnected");
      console.warn(`[whatsapp] ${this.lastError}`);
      this.#scheduleRestart();
    });
  }

  #isCurrent(client, generation) {
    return this.client === client && this.generation === generation;
  }

  #setState(state) {
    this.state = state;
    this.lastEventAt = new Date().toISOString();
  }

  #scheduleRestart() {
    if (this.stopping || this.restartTimer) return;
    this.reconnectAttempt += 1;
    const delay = Math.min(
      RECONNECT_MAX_MS,
      RECONNECT_BASE_MS * (2 ** Math.min(this.reconnectAttempt - 1, 5)),
    );
    console.log(`[whatsapp] Mencoba menyambung ulang dalam ${Math.ceil(delay / 1000)} detik.`);
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      void this.start(true).catch((error) => {
        this.lastError = safeError(error);
        this.#setState("error");
        this.#scheduleRestart();
      });
    }, delay);
    this.restartTimer.unref?.();
  }

  #clearRestartTimer() {
    if (!this.restartTimer) return;
    clearTimeout(this.restartTimer);
    this.restartTimer = null;
  }

  async #destroyCurrentClient(logout) {
    const client = this.client;
    this.client = null;
    this.generation += 1;
    if (!client) return;

    if (logout) {
      try {
        await client.logout();
      } catch (error) {
        console.warn(`[whatsapp] Logout lama dilewati: ${safeError(error)}`);
      }
    }
    await this.#destroySpecificClient(client);
  }

  async #destroySpecificClient(client) {
    try {
      await client.destroy();
    } catch (error) {
      console.warn(`[whatsapp] Pembersihan client dilewati: ${safeError(error)}`);
    }
  }

  async #removeSessionDirectory() {
    const sessionDirectory = path.resolve(SESSION_BASE_PATH, `session-${CLIENT_ID}`);
    const expectedPrefix = `${SESSION_BASE_PATH}${path.sep}`;
    if (
      SESSION_BASE_PATH === path.parse(SESSION_BASE_PATH).root
      || !sessionDirectory.startsWith(expectedPrefix)
      || sessionDirectory === SESSION_BASE_PATH
    ) {
      throw new Error("Lokasi sesi tidak aman untuk dihapus.");
    }
    await fs.rm(sessionDirectory, { recursive: true, force: true });
    console.log("[whatsapp] Sesi lama dihapus. QR baru akan dibuat.");
  }
}

function stateMessage(state) {
  const messages = {
    idle: "Service siap memulai WhatsApp.",
    starting: "Membuka WhatsApp Web dan memulihkan sesi.",
    qr: "Pindai QR ini satu kali dari aplikasi WhatsApp di ponsel.",
    authenticated: "QR diterima. Menyelesaikan koneksi WhatsApp.",
    ready: "WhatsApp terhubung dan siap mengirim notifikasi.",
    disconnected: "Koneksi WhatsApp terputus. Service sedang menyambung ulang.",
    auth_failure: "Sesi ditolak. Hapus sesi dari halaman admin untuk membuat QR baru.",
    error: "Service WhatsApp mengalami masalah. Periksa detail kesalahan atau mulai ulang.",
    stopped: "Service WhatsApp dihentikan.",
  };
  return messages[state] || "Status WhatsApp tidak diketahui.";
}

function accountFromClient(client) {
  const info = client.info;
  if (!info) return null;
  const phone = info.wid?.user || null;
  return {
    wid: info.wid?._serialized || null,
    phone,
    name: info.pushname || null,
    platform: info.platform || null,
  };
}

function normalizePhone(value) {
  if (typeof value !== "string") return null;
  let digits = digitsOnly(value);
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `${DEFAULT_COUNTRY_CODE}${digits.slice(1)}`;
  else if (DEFAULT_COUNTRY_CODE === "62" && digits.startsWith("8")) digits = `62${digits}`;
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

function sanitizeClientId(value) {
  const clientId = String(value).trim().replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 64);
  return clientId || "siparik";
}

function digitsOnly(value) {
  return String(value || "").replace(/\D+/g, "");
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function safeError(error) {
  return error instanceof Error ? error.message : String(error || "Kesalahan tidak diketahui.");
}

function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone || "";
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`;
}

function extractBearerToken(header) {
  if (typeof header !== "string") return "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function validApiKey(received) {
  const expectedBuffer = Buffer.from(API_KEY);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

const manager = new WhatsAppManager();
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "64kb" }));
app.use((request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

app.get("/", (_request, response) => {
  response.json({
    service: "siparik-whatsapp-service",
    ok: true,
    message: "Service berjalan. Endpoint operasional memerlukan API key.",
  });
});

app.get("/health", (_request, response) => {
  const status = manager.status();
  response.json({ ok: true, state: status.state, whatsappReady: status.ready });
});

app.use("/api", (request, response, next) => {
  const token = extractBearerToken(request.headers.authorization);
  if (!validApiKey(token)) {
    return response.status(401).json({ ok: false, message: "API key tidak valid." });
  }
  return next();
});

app.get("/api/status", (_request, response) => {
  response.json({ ok: true, status: manager.status() });
});

app.post("/api/send", async (request, response, next) => {
  try {
    const result = await manager.send(request.body?.phone, request.body?.message);
    response.json({
      ok: true,
      message: "Pesan diterima oleh WhatsApp Web.",
      messageId: result.messageId,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/restart", async (_request, response, next) => {
  try {
    const status = await manager.restart();
    response.status(202).json({ ok: true, message: "Proses koneksi dimulai ulang.", status });
  } catch (error) {
    next(error);
  }
});

app.post("/api/session/reset", async (request, response, next) => {
  try {
    if (request.body?.confirmation !== "RESET") {
      throw new HttpError(400, "Konfirmasi RESET diperlukan untuk menghapus sesi.");
    }
    const status = await manager.resetSession();
    response.status(202).json({ ok: true, message: "Sesi lama dihapus. Menyiapkan QR baru.", status });
  } catch (error) {
    next(error);
  }
});

app.use((_request, response) => {
  response.status(404).json({ ok: false, message: "Endpoint tidak ditemukan." });
});

app.use((error, _request, response, _next) => {
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof HttpError
    ? error.message
    : "Service WhatsApp gagal memproses permintaan.";
  if (!(error instanceof HttpError)) console.error(`[http] ${safeError(error)}`);
  response.status(status).json({ ok: false, message });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`[startup] Service WhatsApp aktif di ${HOST}:${PORT}.`);
  console.log(`[startup] Mode: ${RUNTIME_MODE}; sesi: ${SESSION_BASE_PATH}.`);
  if (RUNNING_ON_RAILWAY && !process.env.RAILWAY_VOLUME_MOUNT_PATH) {
    console.warn("[startup] Railway Volume belum terdeteksi. Pasang volume pada /data agar sesi tidak hilang saat deploy.");
  }
  if (AUTO_START) {
    void manager.start().catch((error) => {
      console.error(`[startup] WhatsApp gagal dimulai: ${safeError(error)}`);
    });
  }
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[shutdown] Menerima ${signal}, menutup service.`);
  server.close();
  const forceExit = setTimeout(() => process.exit(1), 20_000);
  forceExit.unref?.();
  try {
    await manager.stop();
    clearTimeout(forceExit);
    process.exit(0);
  } catch (error) {
    console.error(`[shutdown] ${safeError(error)}`);
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

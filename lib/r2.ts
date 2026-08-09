import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const DEFAULT_PREFIX = "appekraf";
const DEFAULT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const PROXY_PATH = "/api/uploads/r2";

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

type R2Resource = "berita" | "acara";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  jurisdiction: "default" | "eu" | "fedramp";
};

export type R2UploadResult = {
  key: string;
  url: string;
  storageUrl: string;
  contentType: string;
  size: number;
  etag: string | null;
};

export type R2ImageResult = {
  body: Uint8Array;
  contentType: string | null;
  etag: string | null;
  lastModified: Date | null;
  contentLength: number | null;
};

let cachedClient: S3Client | null = null;
let cachedClientKey = "";

function configuredPrefix() {
  const value = process.env.R2_OBJECT_PREFIX?.trim().replace(/^\/+|\/+$/g, "");
  return value || DEFAULT_PREFIX;
}

function configuredMaxBytes() {
  const raw = Number(process.env.R2_MAX_IMAGE_MB);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_MAX_IMAGE_BYTES;
  return Math.floor(raw * 1024 * 1024);
}

function requiredConfig(): R2Config {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();

  // Nama env utama mengikuti dokumentasi S3 SDK Cloudflare.
  // Alias lama tetap didukung agar konfigurasi project sebelumnya tidak rusak.
  const accessKeyId =
    process.env.CLOUDFLARE_ACCESS_KEY_ID?.trim() ||
    process.env.R2_ACCESS_KEY_ID?.trim() ||
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey =
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY?.trim() ||
    process.env.R2_SECRET_ACCESS_KEY?.trim() ||
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();

  const bucketName = process.env.R2_BUCKET_NAME?.trim();
  const rawJurisdiction = process.env.R2_JURISDICTION?.trim().toLowerCase() || "default";

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "Konfigurasi Cloudflare R2 belum lengkap. Isi CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ACCESS_KEY_ID, CLOUDFLARE_SECRET_ACCESS_KEY, dan R2_BUCKET_NAME di .env.local.",
    );
  }

  if (!(["default", "eu", "fedramp"] as const).includes(rawJurisdiction as R2Config["jurisdiction"])) {
    throw new Error("R2_JURISDICTION harus berisi default, eu, atau fedramp.");
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    jurisdiction: rawJurisdiction as R2Config["jurisdiction"],
  };
}

function r2Endpoint(config: R2Config) {
  const jurisdictionSegment = config.jurisdiction === "default" ? "" : `.${config.jurisdiction}`;
  return `https://${config.accountId}${jurisdictionSegment}.r2.cloudflarestorage.com`;
}

function r2Client() {
  const config = requiredConfig();
  const endpoint = r2Endpoint(config);
  const clientKey = `${endpoint}|${config.accessKeyId}`;

  if (!cachedClient || cachedClientKey !== clientKey) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    cachedClientKey = clientKey;
  }

  return { client: cachedClient, config };
}

function publicBaseUrl() {
  const raw = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (!(parsed.protocol === "http:" || parsed.protocol === "https:")) return null;
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function encodeObjectKey(key: string) {
  return key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function proxyUrlForKey(key: string) {
  return `${PROXY_PATH}?key=${encodeURIComponent(key)}`;
}

function decodedKeyFromPathname(pathname: string) {
  const encodedKey = pathname.replace(/^\/+/, "");
  if (!encodedKey) return null;

  try {
    const key = encodedKey
      .split("/")
      .map((part) => decodeURIComponent(part))
      .join("/");
    return isManagedR2ImageKey(key) ? key : null;
  } catch {
    return null;
  }
}

function isR2DevUrl(value: string) {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    return hostname === "r2.dev" || hostname.endsWith(".r2.dev");
  } catch {
    return false;
  }
}

export function storageUrlForR2Key(key: string) {
  const base = publicBaseUrl();
  // r2.dev adalah development endpoint. Untuk menghindari masalah TLS/browser
  // dan agar credential/storage tetap terkontrol aplikasi, sajikan lewat proxy Next.js.
  if (!base || isR2DevUrl(base)) return proxyUrlForKey(key);
  return `${base}/${encodeObjectKey(key)}`;
}

export function browserSafeR2ImageUrl(value: string | undefined | null) {
  if (!value) return value ?? null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const key = keyFromR2StorageReference(trimmed);
  if (!key) return trimmed;

  // URL r2.dev lama yang sudah tersimpan di database selalu diproxy agar browser
  // tidak perlu melakukan koneksi TLS langsung ke hostname development tersebut.
  if (isR2DevUrl(trimmed) || trimmed.startsWith(PROXY_PATH)) return proxyUrlForKey(key);

  const base = publicBaseUrl();
  if (!base || isR2DevUrl(base)) return proxyUrlForKey(key);
  return trimmed;
}

export function isManagedR2ImageKey(key: string) {
  if (!key || key.includes("\\") || key.split("/").some((part) => !part || part === "." || part === "..")) {
    return false;
  }

  const prefix = configuredPrefix();
  return key.startsWith(`${prefix}/berita/`) || key.startsWith(`${prefix}/acara/`);
}

export function keyFromR2StorageReference(value: string | undefined | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed, "http://local.invalid");

    // Proxy internal aplikasi.
    if (trimmed.startsWith("/") && parsed.pathname === PROXY_PATH) {
      const key = parsed.searchParams.get("key");
      return key && isManagedR2ImageKey(key) ? key : null;
    }

    // Kenali seluruh Public Development URL R2, termasuk URL lama yang sudah
    // tersimpan di database walaupun R2_PUBLIC_BASE_URL kemudian dikosongkan.
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "r2.dev" || hostname.endsWith(".r2.dev")) {
      return decodedKeyFromPathname(parsed.pathname);
    }
  } catch {
    return null;
  }

  const base = publicBaseUrl();
  if (!base || !trimmed.startsWith(`${base}/`)) return null;

  const encodedKey = trimmed.slice(base.length + 1);
  try {
    const key = encodedKey
      .split("/")
      .map((part) => decodeURIComponent(part))
      .join("/");
    return isManagedR2ImageKey(key) ? key : null;
  } catch {
    return null;
  }
}

function makeObjectKey(resource: R2Resource, contentType: string) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const extension = IMAGE_EXTENSIONS[contentType];
  return `${configuredPrefix()}/${resource}/${year}/${month}/${randomUUID()}.${extension}`;
}

export function r2ImageMimeFromKey(key: string) {
  const extension = key.split(".").pop()?.toLowerCase();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  if (extension === "avif") return "image/avif";
  return "application/octet-stream";
}

function statusCodeFromError(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const metadata = (error as { $metadata?: { httpStatusCode?: number } }).$metadata;
  return typeof metadata?.httpStatusCode === "number" ? metadata.httpStatusCode : null;
}

function errorName(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const value = (error as { name?: unknown }).name;
  return typeof value === "string" ? value : "";
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return "";
}

function isNotFoundError(error: unknown) {
  const status = statusCodeFromError(error);
  const name = errorName(error);
  return status === 404 || name === "NoSuchKey" || name === "NotFound";
}

function cloudflareS3Error(error: unknown, action: string) {
  const status = statusCodeFromError(error);
  const name = errorName(error);
  const message = errorMessage(error);
  const statusText = status ? `HTTP ${status}` : "Cloudflare R2";
  const detail = [name, message].filter(Boolean).join(": ");

  const authErrorNames = new Set([
    "AccessDenied",
    "InvalidAccessKeyId",
    "InvalidToken",
    "SignatureDoesNotMatch",
  ]);

  const authHint =
    status === 401 ||
    status === 403 ||
    authErrorNames.has(name)
      ? " Pastikan credential berasal dari R2 > Manage API Tokens dan gunakan Access Key ID + Secret Access Key, bukan Bearer API Token. Pastikan token memiliki Object Read & Write untuk bucket yang dipakai."
      : "";

  return new Error(
    detail
      ? `${action} gagal (${statusText}): ${detail}.${authHint}`
      : `${action} gagal (${statusText}).${authHint}`,
  );
}

export async function uploadImageToR2(file: File, resource: string): Promise<R2UploadResult> {
  if (resource !== "berita" && resource !== "acara") {
    throw new Error("Resource upload R2 tidak valid.");
  }
  if (!file.size) throw new Error("File gambar kosong.");

  const contentType = file.type.toLowerCase();
  if (!(contentType in IMAGE_EXTENSIONS)) {
    throw new Error("Format gambar harus JPG/JPEG, PNG, WebP, GIF, atau AVIF.");
  }

  const maxBytes = configuredMaxBytes();
  if (file.size > maxBytes) {
    throw new Error(`Ukuran gambar maksimal ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  }

  const key = makeObjectKey(resource, contentType);
  const body = Buffer.from(await file.arrayBuffer());
  const { client, config } = r2Client();

  try {
    const result = await client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
        ContentLength: body.byteLength,
      }),
    );

    const storageUrl = storageUrlForR2Key(key);
    return {
      key,
      url: storageUrl,
      storageUrl,
      contentType,
      size: file.size,
      etag: result.ETag?.replace(/^\"|\"$/g, "") || null,
    };
  } catch (error) {
    throw cloudflareS3Error(error, "Upload ke Cloudflare R2");
  }
}

export async function getImageFromR2(key: string): Promise<R2ImageResult | null> {
  if (!isManagedR2ImageKey(key)) throw new Error("Object R2 tidak diizinkan.");

  const { client, config } = r2Client();
  try {
    const result = await client.send(
      new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      }),
    );

    if (!result.Body) return null;
    const body = await result.Body.transformToByteArray();

    return {
      body,
      contentType: result.ContentType || null,
      etag: result.ETag?.replace(/^\"|\"$/g, "") || null,
      lastModified: result.LastModified || null,
      contentLength: typeof result.ContentLength === "number" ? result.ContentLength : body.byteLength,
    };
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw cloudflareS3Error(error, "Ambil object Cloudflare R2");
  }
}

export async function deleteImageFromR2(key: string) {
  if (!isManagedR2ImageKey(key)) return false;

  const { client, config } = r2Client();
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      }),
    );
    return true;
  } catch (error) {
    if (isNotFoundError(error)) return true;
    throw cloudflareS3Error(error, "Hapus object Cloudflare R2");
  }
}

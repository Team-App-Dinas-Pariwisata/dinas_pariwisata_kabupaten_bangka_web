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

const SUBMISSION_EXTENSIONS: Record<string, string> = {
  ...IMAGE_EXTENSIONS,
  "application/pdf": "pdf",
};

const DEFAULT_MAX_SUBMISSION_BYTES = 5 * 1024 * 1024;
const SUBMISSION_PROXY_PATH = "/api/uploads/r2/submission";

type R2Resource = "berita" | "acara" | "tempat-wisata" | "hotel" | "kuliner" | "satwa-endemik" | "deteksi";
export type R2SubmissionType = "ekraf" | "sdm" | "komunitas";

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
  body: ArrayBuffer;
  contentType: string | null;
  etag: string | null;
  lastModified: Date | null;
  contentLength: number | null;
};

export type R2StoredObject = R2ImageResult;

function byteArrayToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

let cachedClient: S3Client | null = null;
let cachedClientKey = "";

function configuredPrefix() {
  const value = process.env.R2_OBJECT_PREFIX?.trim().replace(/^\/+|\/+$/g, "");
  return value || DEFAULT_PREFIX;
}


function normalizedImageContentType(file: File) {
  const raw = file.type.toLowerCase().split(";", 1)[0].trim();
  if (raw === "image/jpg") return "image/jpeg";
  if (raw in IMAGE_EXTENSIONS) return raw;

  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  if (extension === "avif") return "image/avif";
  return "";
}

function configuredMaxBytes() {
  const raw = Number(process.env.R2_MAX_IMAGE_MB);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_MAX_IMAGE_BYTES;
  return Math.floor(raw * 1024 * 1024);
}

function configuredMaxSubmissionBytes() {
  const raw = Number(process.env.R2_MAX_SUBMISSION_FILE_MB);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_MAX_SUBMISSION_BYTES;
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

function submissionProxyUrlForKey(key: string) {
  return `${SUBMISSION_PROXY_PATH}?key=${encodeURIComponent(key)}`;
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
  return ["berita", "acara", "tempat-wisata", "hotel", "kuliner", "satwa-endemik", "deteksi"]
    .some((resource) => key.startsWith(`${prefix}/${resource}/`));
}

export function isManagedR2SubmissionKey(key: string) {
  if (!key || key.includes("\\") || key.split("/").some((part) => !part || part === "." || part === "..")) {
    return false;
  }

  const prefix = configuredPrefix();
  return (["ekraf", "sdm", "komunitas"] as const).some((type) =>
    key.startsWith(`${prefix}/pengajuan/${type}/`),
  );
}

export function applicantOwnsR2SubmissionKey(key: string, userId: number) {
  if (!isManagedR2SubmissionKey(key) || !Number.isInteger(userId) || userId <= 0) return false;
  const prefix = configuredPrefix();
  return (["ekraf", "sdm", "komunitas"] as const).some((type) =>
    key.startsWith(`${prefix}/pengajuan/${type}/user-${userId}/`),
  );
}

export function privateSubmissionUrlForR2Key(key: string) {
  if (!isManagedR2SubmissionKey(key)) throw new Error("Object pengajuan R2 tidak valid.");
  return submissionProxyUrlForKey(key);
}

export function keyFromR2SubmissionStorageReference(value: string | undefined | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed, "http://local.invalid");
    if (trimmed.startsWith("/") && parsed.pathname === SUBMISSION_PROXY_PATH) {
      const key = parsed.searchParams.get("key");
      return key && isManagedR2SubmissionKey(key) ? key : null;
    }
  } catch {
    return null;
  }

  return isManagedR2SubmissionKey(trimmed) ? trimmed : null;
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

function sanitizeKeySegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";
}

function normalizedSubmissionContentType(file: File) {
  const raw = file.type.toLowerCase().split(";", 1)[0].trim();
  if (raw === "image/jpg") return "image/jpeg";
  if (raw in SUBMISSION_EXTENSIONS) return raw;

  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  if (extension === "avif") return "image/avif";
  if (extension === "pdf") return "application/pdf";
  return "";
}

function makeSubmissionObjectKey(
  type: R2SubmissionType,
  fieldKey: string,
  contentType: string,
  ownerId?: number | null,
) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const extension = SUBMISSION_EXTENSIONS[contentType];
  const scope = ownerId && Number.isInteger(ownerId) && ownerId > 0 ? `user-${ownerId}` : "public";
  return `${configuredPrefix()}/pengajuan/${type}/${scope}/${year}/${month}/${sanitizeKeySegment(fieldKey)}-${randomUUID()}.${extension}`;
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

export function r2MimeFromKey(key: string) {
  const extension = key.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "application/pdf";
  return r2ImageMimeFromKey(key);
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
  const allowedResources: R2Resource[] = ["berita", "acara", "tempat-wisata", "hotel", "kuliner", "satwa-endemik", "deteksi"];
  if (!allowedResources.includes(resource as R2Resource)) {
    throw new Error("Resource upload R2 tidak valid.");
  }
  if (!file.size) throw new Error("File gambar kosong.");

  const contentType = normalizedImageContentType(file);
  if (!contentType || !(contentType in IMAGE_EXTENSIONS)) {
    throw new Error("Format gambar harus JPG/JPEG, PNG, WebP, GIF, atau AVIF.");
  }

  const maxBytes = configuredMaxBytes();
  if (file.size > maxBytes) {
    throw new Error(`Ukuran gambar maksimal ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  }

  const key = makeObjectKey(resource as R2Resource, contentType);
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
    const bytes = await result.Body.transformToByteArray();
    const body = byteArrayToArrayBuffer(bytes);

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


export async function uploadSubmissionFileToR2(
  file: File,
  type: R2SubmissionType,
  fieldKey: string,
  ownerId?: number | null,
): Promise<R2UploadResult> {
  if (!(
    ["ekraf", "sdm", "komunitas"] as const
  ).includes(type)) {
    throw new Error("Jenis pengajuan untuk upload R2 tidak valid.");
  }
  if (!file.size) throw new Error("File pengajuan kosong.");

  const contentType = normalizedSubmissionContentType(file);
  if (!contentType || !(contentType in SUBMISSION_EXTENSIONS)) {
    throw new Error("Format file pengajuan tidak didukung. Gunakan PDF, JPG/JPEG, atau PNG untuk dokumen pengajuan.");
  }

  const maxBytes = configuredMaxSubmissionBytes();
  if (file.size > maxBytes) {
    throw new Error(`Ukuran file pengajuan maksimal ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  }

  const key = makeSubmissionObjectKey(type, fieldKey, contentType, ownerId);
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
        ContentDisposition: contentType === "application/pdf" ? "inline" : undefined,
        Metadata: {
          source: "si-parik-pengajuan",
          submission_type: type,
          field_key: sanitizeKeySegment(fieldKey),
          owner_scope: ownerId && ownerId > 0 ? `user-${ownerId}` : "public",
        },
      }),
    );

    const storageUrl = privateSubmissionUrlForR2Key(key);
    return {
      key,
      url: storageUrl,
      storageUrl,
      contentType,
      size: file.size,
      etag: result.ETag?.replace(/^\"|\"$/g, "") || null,
    };
  } catch (error) {
    throw cloudflareS3Error(error, "Upload file pengajuan ke Cloudflare R2");
  }
}

export async function getSubmissionFileFromR2(key: string): Promise<R2StoredObject | null> {
  if (!isManagedR2SubmissionKey(key)) throw new Error("Object pengajuan R2 tidak diizinkan.");

  const { client, config } = r2Client();
  try {
    const result = await client.send(
      new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      }),
    );

    if (!result.Body) return null;
    const bytes = await result.Body.transformToByteArray();
    const body = byteArrayToArrayBuffer(bytes);
    return {
      body,
      contentType: result.ContentType || null,
      etag: result.ETag?.replace(/^\"|\"$/g, "") || null,
      lastModified: result.LastModified || null,
      contentLength: typeof result.ContentLength === "number" ? result.ContentLength : body.byteLength,
    };
  } catch (error) {
    if (isNotFoundError(error)) return null;
    throw cloudflareS3Error(error, "Ambil file pengajuan Cloudflare R2");
  }
}

export async function deleteSubmissionFileFromR2(key: string) {
  if (!isManagedR2SubmissionKey(key)) return false;

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
    throw cloudflareS3Error(error, "Hapus file pengajuan Cloudflare R2");
  }
}

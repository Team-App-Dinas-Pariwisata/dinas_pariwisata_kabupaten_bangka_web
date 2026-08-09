const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";
const IMGBB_MAX_BYTES = 32 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 45_000;

export type ImgBBUploadResult = {
  id: string;
  /** URL yang disimpan ke database: halaman viewer ImgBB format https://ibb.co.com/{id}. */
  url: string;
  /** Alias URL viewer format akun yang disimpan ke database: https://ibb.co.com/{id}. */
  viewerUrl: string;
  /** URL viewer asli yang dikembalikan API ImgBB (umumnya https://ibb.co/{id}). */
  apiViewerUrl: string;
  /** Direct image URL dari ImgBB. Hanya metadata, tidak disimpan ke database. */
  directUrl: string;
  displayUrl: string;
  deleteUrl: string;
  width: number | null;
  height: number | null;
};

type ImgBBResponse = {
  data?: {
    id?: string;
    url?: string;
    display_url?: string;
    url_viewer?: string;
    delete_url?: string;
    width?: string | number;
    height?: string | number;
    image?: { url?: string };
  };
  success?: boolean;
  status?: number;
  error?: { message?: string } | string;
};

function messageFromResponse(payload: ImgBBResponse | null, fallback: string) {
  if (!payload) return fallback;
  if (typeof payload.error === "string" && payload.error.trim()) return payload.error.trim();
  if (payload.error && typeof payload.error === "object" && payload.error.message) return payload.error.message;
  return fallback;
}

function numberOrNull(value: string | number | undefined) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsedHttpUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
}

/** URL halaman viewer ImgBB yang boleh disimpan ke database. */
export function isImgBBViewerUrl(value: string | undefined) {
  const parsed = parsedHttpUrl(value);
  if (!parsed) return false;
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  return host === "ibb.co" || host === "ibb.co.com" || host === "imgbb.com" || host.endsWith(".imgbb.com");
}

export function isImageFile(file: File) {
  return file.type.toLowerCase().startsWith("image/");
}

async function requestUpload(file: File, apiKey: string) {
  const body = new FormData();
  // Sengaja tidak mengirim parameter `name` ke ImgBB.
  // Dengan begitu aplikasi tidak lagi membuat nama seperti berita-foto-utama-....
  body.append("image", file, file.name || "image");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const response = await fetch(`${IMGBB_UPLOAD_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      body,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, max-age=0",
        Pragma: "no-cache",
      },
    });

    let payload: ImgBBResponse | null = null;
    try {
      payload = (await response.json()) as ImgBBResponse;
    } catch {
      payload = null;
    }
    return { response, payload };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Mengunggah gambar ke ImgBB lalu menyimpan format viewer akun https://ibb.co.com/{id}.
 * ID diambil dari response API ImgBB, sementara data.url_viewer asli tetap tersedia sebagai apiViewerUrl.
 * Direct CDN URL data.url hanya dikembalikan sebagai metadata/debug dan tidak disimpan.
 */
export async function uploadImageToImgBB(file: File): Promise<ImgBBUploadResult> {
  const apiKey = process.env.IMGBB_API_KEY?.trim();
  if (!apiKey) throw new Error("IMGBB_API_KEY belum diatur pada .env.local. Tambahkan API key ImgBB terlebih dahulu.");
  if (!file.size) throw new Error("File gambar kosong.");
  if (!isImageFile(file)) throw new Error("File yang dikirim ke ImgBB harus berupa gambar.");
  if (file.size > IMGBB_MAX_BYTES) throw new Error("Ukuran gambar melebihi batas ImgBB 32 MB.");

  try {
    const { response, payload } = await requestUpload(file, apiKey);

    const apiViewerCandidate = payload?.data?.url_viewer?.trim() || "";
    const apiViewerParsed = parsedHttpUrl(apiViewerCandidate);
    const apiViewerUrl = apiViewerParsed?.toString() || "";
    const imageId = String(payload?.data?.id ?? "").trim();

    if (!response.ok || payload?.success === false || !imageId || !isImgBBViewerUrl(apiViewerUrl)) {
      const fallback = !apiViewerUrl || !imageId
        ? "ImgBB tidak mengembalikan id / data.url_viewer yang valid."
        : `Upload ImgBB gagal (HTTP ${response.status}).`;
      throw new Error(messageFromResponse(payload, fallback));
    }

    // Format ini sama seperti link yang tampil pada akun ImgBB pengguna.
    // Database sengaja menyimpan halaman viewer, bukan direct CDN i.ibb.co.
    const viewerUrl = `https://ibb.co.com/${encodeURIComponent(imageId)}`;

    const directCandidate = payload?.data?.url?.trim() || payload?.data?.image?.url?.trim() || "";
    const directParsed = parsedHttpUrl(directCandidate);
    const directUrl = directParsed?.toString() || "";

    const displayCandidate = payload?.data?.display_url?.trim() || "";
    const displayParsed = parsedHttpUrl(displayCandidate);
    const displayUrl = displayParsed?.toString() || directUrl;

    return {
      id: payload?.data?.id ?? "",
      url: viewerUrl,
      viewerUrl,
      apiViewerUrl,
      directUrl,
      displayUrl,
      deleteUrl: payload?.data?.delete_url || "",
      width: numberOrNull(payload?.data?.width),
      height: numberOrNull(payload?.data?.height),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("Upload ke ImgBB melewati batas waktu. Silakan coba lagi.");
    if (error instanceof Error && (error.message.includes("ImgBB") || error.message.includes("IMGBB_API_KEY"))) throw error;
    throw new Error(`Upload ke ImgBB gagal: ${error instanceof Error ? error.message : "kesalahan jaringan"}`);
  }
}

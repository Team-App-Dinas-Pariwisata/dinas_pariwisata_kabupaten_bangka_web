import React from "react";
import { browserSafeR2ImageUrl } from "@/lib/r2";

type ResponsiveImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src?: string | null;
  fallbackSrc?: string;
};

/**
 * Komponen gambar adaptif untuk portal Si Parik Bangka:
 * - Menghasilkan elemen HTML <picture> dengan <source media="(max-width: 768px)">
 *   sehingga layar smartphone/mobile otomatis mengunduh versi mobile yang telah dikompresi WebP.
 * - Layar laptop/desktop otomatis mengunduh versi gambar asli tanpa kompresi untuk kualitas maksimal.
 * - Jika gambar lama belum memiliki versi mobile di Cloudflare R2, server otomatis mengembalikan gambar asli (tidak error).
 */
export default function ResponsiveImage({
  src,
  alt = "",
  fallbackSrc = "/hero-home-v15.jpg",
  className,
  style,
  loading = "lazy",
  ...props
}: ResponsiveImageProps) {
  if (!src) {
    return <img src={fallbackSrc} alt={alt} className={className} style={style} loading={loading} {...props} />;
  }

  const desktopSrc = browserSafeR2ImageUrl(src, { variant: "original" }) || fallbackSrc;
  const mobileSrc = browserSafeR2ImageUrl(src, { variant: "mobile" }) || fallbackSrc;

  return (
    <picture>
      <source media="(max-width: 768px)" srcSet={mobileSrc} />
      <img
        src={desktopSrc}
        alt={alt}
        className={className}
        style={style}
        loading={loading}
        {...props}
      />
    </picture>
  );
}

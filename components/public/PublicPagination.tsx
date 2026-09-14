import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  basePath: string;
  alwaysShow?: boolean;
};

function makeHref(basePath: string, targetPage: number) {
  const separator = basePath.includes("?") ? "&" : "?";
  return `${basePath}${separator}page=${targetPage}`;
}

export default function PublicPagination({ page, totalPages, basePath, alwaysShow = false }: Props) {
  if (!alwaysShow && totalPages <= 1) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const currentPage = Math.min(safeTotalPages, Math.max(1, page));
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(safeTotalPages, currentPage + 2);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  return (
    <nav className="public-pagination" aria-label="Navigasi halaman">
      {currentPage > 1 ? (
        <Link href={makeHref(basePath, currentPage - 1)}>← Sebelumnya</Link>
      ) : (
        <span className="is-disabled">← Sebelumnya</span>
      )}
      <div>
        {start > 1 && <Link href={makeHref(basePath, 1)}>1</Link>}
        {start > 2 && <span className="pagination-ellipsis">…</span>}
        {pages.map((value) => (
          <Link
            key={value}
            href={makeHref(basePath, value)}
            className={value === currentPage ? "is-active" : ""}
            aria-current={value === currentPage ? "page" : undefined}
          >
            {value}
          </Link>
        ))}
        {end < safeTotalPages - 1 && <span className="pagination-ellipsis">…</span>}
        {end < safeTotalPages && <Link href={makeHref(basePath, safeTotalPages)}>{safeTotalPages}</Link>}
      </div>
      {currentPage < safeTotalPages ? (
        <Link href={makeHref(basePath, currentPage + 1)}>Berikutnya →</Link>
      ) : (
        <span className="is-disabled">Berikutnya →</span>
      )}
    </nav>
  );
}

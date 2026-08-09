import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  basePath: string;
};

export default function PublicPagination({ page, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;

  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  return (
    <nav className="public-pagination" aria-label="Navigasi halaman">
      {page > 1 ? <Link href={`${basePath}?page=${page - 1}`}>← Sebelumnya</Link> : <span className="is-disabled">← Sebelumnya</span>}
      <div>
        {start > 1 && <Link href={`${basePath}?page=1`}>1</Link>}
        {start > 2 && <span className="pagination-ellipsis">…</span>}
        {pages.map((value) => (
          <Link key={value} href={`${basePath}?page=${value}`} className={value === page ? "is-active" : ""} aria-current={value === page ? "page" : undefined}>
            {value}
          </Link>
        ))}
        {end < totalPages - 1 && <span className="pagination-ellipsis">…</span>}
        {end < totalPages && <Link href={`${basePath}?page=${totalPages}`}>{totalPages}</Link>}
      </div>
      {page < totalPages ? <Link href={`${basePath}?page=${page + 1}`}>Berikutnya →</Link> : <span className="is-disabled">Berikutnya →</span>}
    </nav>
  );
}

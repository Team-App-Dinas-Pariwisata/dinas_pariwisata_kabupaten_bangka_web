"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingPage, setPendingPage] = useState<number | null>(null);

  const safeTotalPages = Math.max(1, totalPages);
  const currentPage = Math.min(safeTotalPages, Math.max(1, page));
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(safeTotalPages, currentPage + 2);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  // Clear loading state when page prop changes or transition finishes
  useEffect(() => {
    if (!isPending) {
      setPendingPage(null);
      if (typeof document !== "undefined") {
        document.body.classList.remove("is-paging-loading");
      }
    }
  }, [isPending, page]);

  // Clean up body class on unmount
  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.classList.remove("is-paging-loading");
      }
    };
  }, []);

  const handlePageClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetPage: number,
    href: string,
  ) => {
    if (targetPage === currentPage || isPending) {
      e.preventDefault();
      return;
    }
    // Allow opening in new tab if user holds modifier key
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
      return;
    }

    e.preventDefault();
    setPendingPage(targetPage);
    if (typeof document !== "undefined") {
      document.body.classList.add("is-paging-loading");
    }

    startTransition(() => {
      router.push(href, { scroll: true });
    });
  };

  if (!alwaysShow && totalPages <= 1) return null;

  return (
    <div className="public-pagination-wrap" data-pagination="true">
      {/* Simple preloader icon indicator for pagination */}
      {isPending && (
        <div
          className="public-pagination-simple-loader"
          role="status"
          aria-live="polite"
          aria-label={`Memuat halaman ${pendingPage ?? ""}`}
        >
          <span className="simple-loader-spinner" aria-hidden="true" />
          <span>Memuat data halaman {pendingPage}…</span>
        </div>
      )}

      <nav className="public-pagination" aria-label="Navigasi halaman" data-pagination="true">
        {currentPage > 1 ? (
          <Link
            href={makeHref(basePath, currentPage - 1)}
            onClick={(e) => handlePageClick(e, currentPage - 1, makeHref(basePath, currentPage - 1))}
            className={pendingPage === currentPage - 1 ? "is-loading" : ""}
            data-pagination-link="true"
          >
            {pendingPage === currentPage - 1 ? (
              <span className="inline-simple-spinner" aria-hidden="true" />
            ) : (
              "← Sebelumnya"
            )}
          </Link>
        ) : (
          <span className="is-disabled">← Sebelumnya</span>
        )}

        <div>
          {start > 1 && (
            <Link
              href={makeHref(basePath, 1)}
              onClick={(e) => handlePageClick(e, 1, makeHref(basePath, 1))}
              className={pendingPage === 1 ? "is-loading" : ""}
              data-pagination-link="true"
            >
              {pendingPage === 1 ? <span className="inline-simple-spinner" aria-hidden="true" /> : "1"}
            </Link>
          )}

          {start > 2 && <span className="pagination-ellipsis">…</span>}

          {pages.map((value) => {
            const isCurrentlyActive = value === currentPage;
            const isCurrentlyLoading = pendingPage === value;
            return (
              <Link
                key={value}
                href={makeHref(basePath, value)}
                onClick={(e) => handlePageClick(e, value, makeHref(basePath, value))}
                className={`${isCurrentlyActive ? "is-active" : ""} ${isCurrentlyLoading ? "is-loading" : ""}`}
                aria-current={isCurrentlyActive ? "page" : undefined}
                aria-busy={isCurrentlyLoading ? "true" : undefined}
                data-pagination-link="true"
              >
                {isCurrentlyLoading ? (
                  <span className="inline-simple-spinner" aria-hidden="true" />
                ) : (
                  value
                )}
              </Link>
            );
          })}

          {end < safeTotalPages - 1 && <span className="pagination-ellipsis">…</span>}

          {end < safeTotalPages && (
            <Link
              href={makeHref(basePath, safeTotalPages)}
              onClick={(e) => handlePageClick(e, safeTotalPages, makeHref(basePath, safeTotalPages))}
              className={pendingPage === safeTotalPages ? "is-loading" : ""}
              data-pagination-link="true"
            >
              {pendingPage === safeTotalPages ? (
                <span className="inline-simple-spinner" aria-hidden="true" />
              ) : (
                safeTotalPages
              )}
            </Link>
          )}
        </div>

        {currentPage < safeTotalPages ? (
          <Link
            href={makeHref(basePath, currentPage + 1)}
            onClick={(e) => handlePageClick(e, currentPage + 1, makeHref(basePath, currentPage + 1))}
            className={pendingPage === currentPage + 1 ? "is-loading" : ""}
            data-pagination-link="true"
          >
            {pendingPage === currentPage + 1 ? (
              <span className="inline-simple-spinner" aria-hidden="true" />
            ) : (
              "Berikutnya →"
            )}
          </Link>
        ) : (
          <span className="is-disabled">Berikutnya →</span>
        )}
      </nav>
    </div>
  );
}

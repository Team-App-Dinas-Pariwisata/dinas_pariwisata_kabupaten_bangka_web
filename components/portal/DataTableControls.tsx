"use client";

export type SortDirection = "asc" | "desc";

type SortableHeaderProps = {
  label: string;
  sortKey: string;
  activeKey: string | null;
  direction: SortDirection;
  onSort: (key: string) => void;
};

type TablePaginationProps = {
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  itemLabel?: string;
};

const collator = new Intl.Collator("id-ID", { numeric: true, sensitivity: "base" });

function dateTimestamp(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?/.test(value)) return null;
  const parsed = new Date(value.replace(" ", "T")).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

export function compareTableValues(left: unknown, right: unknown) {
  const leftEmpty = left === null || left === undefined || left === "";
  const rightEmpty = right === null || right === undefined || right === "";
  if (leftEmpty && rightEmpty) return 0;
  if (leftEmpty) return 1;
  if (rightEmpty) return -1;

  if (typeof left === "number" && typeof right === "number") return left - right;
  if (typeof left === "boolean" && typeof right === "boolean") return Number(left) - Number(right);

  const leftText = String(left).trim();
  const rightText = String(right).trim();

  const leftDate = dateTimestamp(leftText);
  const rightDate = dateTimestamp(rightText);
  if (leftDate !== null && rightDate !== null) return leftDate - rightDate;

  const leftNumber = /^-?\d+(?:[.,]\d+)?$/.test(leftText) ? Number(leftText.replace(",", ".")) : null;
  const rightNumber = /^-?\d+(?:[.,]\d+)?$/.test(rightText) ? Number(rightText.replace(",", ".")) : null;
  if (leftNumber !== null && rightNumber !== null && Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber;
  }

  return collator.compare(leftText, rightText);
}

export function SortableTableHeader({ label, sortKey, activeKey, direction, onSort }: SortableHeaderProps) {
  const active = activeKey === sortKey;
  const ariaSort = active ? (direction === "asc" ? "ascending" : "descending") : "none";

  return (
    <th className={`dm-sortable-th ${active ? "active" : ""}`} aria-sort={ariaSort}>
      <button type="button" className="dm-sort-button" onClick={() => onSort(sortKey)} title={`Urutkan berdasarkan ${label}`}>
        <span>{label}</span>
        <span className="dm-sort-indicator" aria-hidden="true">{active ? (direction === "asc" ? "▲" : "▼") : "↕"}</span>
      </button>
    </th>
  );
}

function visiblePages(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1) as Array<number | "ellipsis-left" | "ellipsis-right">;

  const pages: Array<number | "ellipsis-left" | "ellipsis-right"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("ellipsis-left");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < total - 1) pages.push("ellipsis-right");
  pages.push(total);
  return pages;
}

export function TablePagination({ totalItems, page, pageSize, onPageChange, onPageSizeChange, itemLabel = "data" }: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);
  const pages = visiblePages(safePage, totalPages);

  return (
    <div className="dm-pagination" aria-label="Navigasi halaman tabel">
      <div className="dm-pagination-summary">
        <span>Menampilkan <strong>{start}–{end}</strong> dari <strong>{totalItems}</strong> {itemLabel}</span>
        <label>
          <span>Baris</span>
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} aria-label="Jumlah baris per halaman">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>

      <div className="dm-pagination-pages">
        <button type="button" className="dm-page-nav" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)} aria-label="Halaman sebelumnya">‹</button>
        {pages.map((item) => typeof item === "number" ? (
          <button
            type="button"
            key={item}
            className={item === safePage ? "active" : ""}
            onClick={() => onPageChange(item)}
            aria-current={item === safePage ? "page" : undefined}
          >
            {item}
          </button>
        ) : <span className="dm-page-ellipsis" key={item}>…</span>)}
        <button type="button" className="dm-page-nav" disabled={safePage >= totalPages} onClick={() => onPageChange(safePage + 1)} aria-label="Halaman berikutnya">›</button>
      </div>
    </div>
  );
}

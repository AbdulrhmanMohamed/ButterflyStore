"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

function getPages(page: number, total: number): (number | "…")[] {
  const set = new Set<number>([1, total, page - 1, page, page + 1]);
  const pages: (number | "…")[] = [];
  let prev = 0;
  for (let i = 1; i <= total; i++) {
    if (!set.has(i)) continue;
    if (i - prev > 1) pages.push("…");
    pages.push(i);
    prev = i;
  }
  return pages;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = getPages(page, totalPages);

  return (
    <div className="flex justify-center animate-fade-in-up">
      <div className="flex items-center gap-1 bg-white rounded-full border border-border/40 shadow-lg shadow-content/5 p-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="w-9 h-9 rounded-full flex items-center justify-center text-content-muted hover:text-white hover:bg-gradient-to-r hover:from-primary hover:to-accent disabled:opacity-30 disabled:hover:text-content-muted disabled:hover:bg-transparent transition-all"
          aria-label="Previous page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-content-muted/40 text-sm font-bold">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${
                p === page
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-md shadow-accent/30 scale-105"
                  : "text-content-muted hover:text-primary hover:bg-surface/70"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="w-9 h-9 rounded-full flex items-center justify-center text-content-muted hover:text-white hover:bg-gradient-to-r hover:from-primary hover:to-accent disabled:opacity-30 disabled:hover:text-content-muted disabled:hover:bg-transparent transition-all"
          aria-label="Next page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

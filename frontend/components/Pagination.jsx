"use client";

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  hasNext = false,
  hasPrev = false,
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let p = startPage; p <= endPage; p++) {
    pages.push(p);
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-6">
      <div className="text-xs text-gray-500 font-medium">
        Page <span className="font-bold text-gray-900">{currentPage}</span> of{" "}
        <span className="font-bold text-gray-900">{totalPages}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrev && currentPage <= 1}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
        >
          ← Previous
        </button>

        {startPage > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className={`w-8 h-8 text-xs font-semibold rounded-xl border transition ${
                currentPage === 1
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              1
            </button>
            {startPage > 2 && (
              <span className="text-xs text-gray-400 px-1">...</span>
            )}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 text-xs font-semibold rounded-xl border transition ${
              currentPage === p
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="text-xs text-gray-400 px-1">...</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className={`w-8 h-8 text-xs font-semibold rounded-xl border transition ${
                currentPage === totalPages
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext && currentPage >= totalPages}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

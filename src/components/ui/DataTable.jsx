import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Pagination from "./Pagination";
import EmptyState from "./EmptyState";

const PAGE_SIZE = 10;

/**
 * Generic data table.
 * columns: [{ key, label, sortable, render?: (row) => ReactNode }]
 */
export default function DataTable({ columns, data, loading = false, pageSize = PAGE_SIZE }) {
  const [sort, setSort] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(1);

  const sortedData = useMemo(() => {
    if (!sort.key) return data;
    const column = columns.find((c) => c.key === sort.key);
    return [...data].sort((a, b) => {
      const aVal = column?.sortValue ? column.sortValue(a) : a[sort.key];
      const bVal = column?.sortValue ? column.sortValue(b) : b[sort.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const comparison =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [data, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageData = sortedData.slice((safePage - 1) * pageSize, safePage * pageSize);

  function handleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
    setPage(1);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-gray-700"
                    >
                      {col.label}
                      {sort.key === col.key ? (
                        sort.direction === "asc" ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        )
                      ) : (
                        <ArrowUpDown size={12} className="text-gray-300" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, rowIndex) => (
              <tr
                key={row.id ?? rowIndex}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
              >
                {columns.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {col.render ? col.render(row) : row[col.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageData.length === 0 && <EmptyState />}
      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

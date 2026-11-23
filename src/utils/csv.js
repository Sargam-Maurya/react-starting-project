/**
 * Exports rows to a CSV file download.
 * columns: [{ key, label, value?: (row) => any }]
 */
export function exportToCsv(filename, columns, rows) {
  const escapeCell = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const body = rows.map((row) =>
    columns
      .map((c) => escapeCell(c.value ? c.value(row) : row[c.key]))
      .join(",")
  );

  const csv = [header, ...body].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

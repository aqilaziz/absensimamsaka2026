"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function ExportExcelButton({
  rows,
  filename,
  sheetName = "Rekap",
}: {
  rows: Record<string, string | number | null>[];
  filename: string;
  sheetName?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function onExport() {
    setLoading(true);
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, filename);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={onExport} disabled={loading} className="btn-secondary">
      <span className="inline-flex items-center gap-1.5">
        <Download size={14} />
        {loading ? "Menyiapkan…" : "Export Excel"}
      </span>
    </button>
  );
}

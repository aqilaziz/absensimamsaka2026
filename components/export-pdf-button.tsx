"use client";

import { useState } from "react";
import { FileText } from "lucide-react";

export interface ExportPdfOptions {
  title: string;
  subtitle?: string;
  info?: { label: string; value: string }[];
  headers: string[];
  rows: (string | number)[][];
  footers?: (string | number)[];
  filename: string;
  columnStyles?: Record<number, { halign?: "left" | "center" | "right"; cellWidth?: number }>;
  orientation?: "portrait" | "landscape";
}

export function ExportPdfButton(props: ExportPdfOptions) {
  const [loading, setLoading] = useState(false);

  async function onExport() {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({
        orientation: props.orientation ?? "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      // Judul Laporan
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(props.title, 14, 15);

      let yPos = 21;

      // Subtitle
      if (props.subtitle) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(props.subtitle, 14, yPos);
        yPos += 5;
      }

      // Metadata Info (mis. Kelas, Semester, Rentang Waktu)
      if (props.info && props.info.length > 0) {
        doc.setFontSize(9);
        const infoText = props.info
          .map((item) => `${item.label}: ${item.value}`)
          .join("   |   ");
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text(infoText, 14, yPos);
        yPos += 6;
      }

      // Tabel Data
      autoTable(doc, {
        startY: yPos,
        head: [props.headers],
        body: props.rows,
        foot: props.footers ? [props.footers] : undefined,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 2,
          lineColor: [226, 232, 240], // slate-200
          lineWidth: 0.1,
          textColor: [30, 41, 59], // slate-800
        },
        headStyles: {
          fillColor: [6, 95, 70], // emerald-800
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8.5,
          halign: "center",
        },
        footStyles: {
          fillColor: [241, 245, 249], // slate-100
          textColor: [15, 23, 42],
          fontStyle: "bold",
          fontSize: 8.5,
        },
        columnStyles: props.columnStyles,
        didDrawPage: (data) => {
          // Footer halaman
          const pageCount = doc.getNumberOfPages();
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text(
            `Dicetak pada ${new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })} — Halaman ${data.pageNumber} dari ${pageCount}`,
            pageWidth - 14,
            doc.internal.pageSize.getHeight() - 8,
            { align: "right" }
          );
        },
      });

      doc.save(props.filename);
    } catch (err) {
      console.error("Gagal mengekspor PDF:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={onExport} disabled={loading} className="btn-secondary">
      <span className="inline-flex items-center gap-1.5">
        <FileText size={15} />
        {loading ? "Menyiapkan…" : "Export PDF"}
      </span>
    </button>
  );
}

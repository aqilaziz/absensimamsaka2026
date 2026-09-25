import {
  endOfMonth,
  format,
  getDay,
  parseISO,
  startOfMonth,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { StatusAbsensi } from "@/lib/types";

interface Rekaman {
  tanggal: string;
  status: StatusAbsensi;
  keterangan: string | null;
}

const WARNA: Record<StatusAbsensi, string> = {
  hadir: "bg-emerald-400 text-white",
  sakit: "bg-amber-400 text-white",
  izin: "bg-sky-400 text-white",
  alpha: "bg-red-500 text-white",
};

const LABEL: Record<StatusAbsensi, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alpha: "Alpha",
};

export function KalenderAbsensi({ records }: { records: Rekaman[] }) {
  if (records.length === 0) return null;

  const byDate = new Map(records.map((r) => [r.tanggal, r]));
  const bulanList = [...new Set(records.map((r) => r.tanggal.slice(0, 7)))].sort();

  return (
    <div className="card">
      <p className="mb-4 text-sm font-semibold text-slate-900">Kalender</p>
      <div className="flex flex-wrap gap-6">
        {bulanList.map((bl) => {
          const awal = startOfMonth(parseISO(bl + "-01"));
          const akhir = endOfMonth(awal);
          // offset dengan awal pekan Senin
          const offset = (getDay(awal) + 6) % 7;
          const jumlahHari = akhir.getDate();

          return (
            <div key={bl}>
              <p className="mb-2 text-xs font-semibold text-slate-600">
                {format(awal, "MMMM yyyy", { locale: localeId })}
              </p>
              <div className="grid grid-cols-7 gap-1">
                {["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"].map((h) => (
                  <span
                    key={h}
                    className="flex h-7 w-7 items-center justify-center text-[10px] text-slate-400"
                  >
                    {h}
                  </span>
                ))}
                {Array.from({ length: offset }).map((_, i) => (
                  <span key={`k${i}`} className="h-7 w-7" />
                ))}
                {Array.from({ length: jumlahHari }).map((_, i) => {
                  const tgl = `${bl}-${String(i + 1).padStart(2, "0")}`;
                  const r = byDate.get(tgl);
                  return (
                    <span
                      key={tgl}
                      title={
                        r
                          ? `${tgl}: ${LABEL[r.status]}${r.keterangan ? ` — ${r.keterangan}` : ""}`
                          : tgl
                      }
                      className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] ${
                        r ? WARNA[r.status] : "bg-slate-50 text-slate-300"
                      }`}
                    >
                      {i + 1}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { addDays, endOfMonth, format, parse } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { NamaSemester, TahunPelajaran } from "./types";

export type Periode = "bulan" | "semester" | "tahun";

export interface Rentang {
  dari: string;
  sampai: string;
  label: string;
}

/** Semester yang sedang berjalan hari ini berdasarkan batas semester tahun.
 *  Ganjil: mulai s.d. batas_semester · Genap: batas_semester+1 s.d. selesai. */
export function semesterAktifHariIni(tahun: TahunPelajaran): NamaSemester {
  const hariIni = format(new Date(), "yyyy-MM-dd");
  return hariIni <= tahun.batas_semester ? "ganjil" : "genap";
}

export function labelSemester(nama: NamaSemester): string {
  return nama === "genap" ? "Semester Genap" : "Semester Ganjil";
}

export function hitungRentang(
  periode: Periode,
  nilai: string | undefined,
  tahun: TahunPelajaran,
): Rentang {
  if (periode === "semester") {
    if (nilai === "genap") {
      const dari = addDays(new Date(tahun.batas_semester), 1);
      return {
        dari: format(dari, "yyyy-MM-dd"),
        sampai: tahun.tgl_selesai,
        label: "Semester Genap",
      };
    }
    return {
      dari: tahun.tgl_mulai,
      sampai: tahun.batas_semester,
      label: "Semester Ganjil",
    };
  }

  if (periode === "tahun") {
    return {
      dari: tahun.tgl_mulai,
      sampai: tahun.tgl_selesai,
      label: `Tahun ${tahun.nama}`,
    };
  }

  const bulan =
    nilai && /^\d{4}-\d{2}$/.test(nilai)
      ? nilai
      : format(new Date(), "yyyy-MM");
  const start = parse(bulan, "yyyy-MM", new Date());
  return {
    dari: format(start, "yyyy-MM-dd"),
    sampai: format(endOfMonth(start), "yyyy-MM-dd"),
    label: format(start, "MMMM yyyy", { locale: localeId }),
  };
}

export function formatTanggal(iso: string): string {
  return format(new Date(iso + "T00:00:00"), "d MMM yyyy", {
    locale: localeId,
  });
}

export function formatTanggalPanjang(iso: string): string {
  return format(new Date(iso + "T00:00:00"), "EEEE, d MMMM yyyy", {
    locale: localeId,
  });
}

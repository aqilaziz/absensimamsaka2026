import type { WarnaMapel } from "./types";

export interface WarnaTema {
  /** Label bahasa Indonesia untuk dipakai di pemilih warna. */
  label: string;
  /** Kelas untuk badge solid: latar + teks + cincin. */
  badge: string;
  /** Kelas untuk titik (dot) kecil penanda warna. */
  dot: string;
  /** Kelas untuk kartu lembut (latar tipis + cincin). */
  lembut: string;
  /** Warna teks saja. */
  teks: string;
  /** Batang aksen kiri. */
  batang: string;
}

/**
 * Palet warna tema mata pelajaran.
 *
 * Setiap mapel memilih satu warna di sini; seluruh antarmuka memakai warna
 * yang sama agar mudah dikenali sekilas (satu mapel = satu warna).
 */
export const PALET_MAPEL: Record<WarnaMapel, WarnaTema> = {
  emerald: {
    label: "Hijau",
    badge: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
    lembut: "bg-emerald-50 ring-emerald-200",
    teks: "text-emerald-700",
    batang: "bg-emerald-500",
  },
  sky: {
    label: "Biru langit",
    badge: "bg-sky-100 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
    lembut: "bg-sky-50 ring-sky-200",
    teks: "text-sky-700",
    batang: "bg-sky-500",
  },
  violet: {
    label: "Ungu",
    badge: "bg-violet-100 text-violet-700 ring-violet-200",
    dot: "bg-violet-500",
    lembut: "bg-violet-50 ring-violet-200",
    teks: "text-violet-700",
    batang: "bg-violet-500",
  },
  amber: {
    label: "Kuning",
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
    dot: "bg-amber-500",
    lembut: "bg-amber-50 ring-amber-200",
    teks: "text-amber-800",
    batang: "bg-amber-500",
  },
  rose: {
    label: "Merah muda",
    badge: "bg-rose-100 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
    lembut: "bg-rose-50 ring-rose-200",
    teks: "text-rose-700",
    batang: "bg-rose-500",
  },
  teal: {
    label: "Toska",
    badge: "bg-teal-100 text-teal-700 ring-teal-200",
    dot: "bg-teal-500",
    lembut: "bg-teal-50 ring-teal-200",
    teks: "text-teal-700",
    batang: "bg-teal-500",
  },
  indigo: {
    label: "Nila",
    badge: "bg-indigo-100 text-indigo-700 ring-indigo-200",
    dot: "bg-indigo-500",
    lembut: "bg-indigo-50 ring-indigo-200",
    teks: "text-indigo-700",
    batang: "bg-indigo-500",
  },
  orange: {
    label: "Oranye",
    badge: "bg-orange-100 text-orange-700 ring-orange-200",
    dot: "bg-orange-500",
    lembut: "bg-orange-50 ring-orange-200",
    teks: "text-orange-700",
    batang: "bg-orange-500",
  },
  cyan: {
    label: "Sian",
    badge: "bg-cyan-100 text-cyan-700 ring-cyan-200",
    dot: "bg-cyan-500",
    lembut: "bg-cyan-50 ring-cyan-200",
    teks: "text-cyan-700",
    batang: "bg-cyan-500",
  },
  fuchsia: {
    label: "Magenta",
    badge: "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200",
    dot: "bg-fuchsia-500",
    lembut: "bg-fuchsia-50 ring-fuchsia-200",
    teks: "text-fuchsia-700",
    batang: "bg-fuchsia-500",
  },
};

export const WARNA_MAPEL_LIST = Object.keys(PALET_MAPEL) as WarnaMapel[];

export const WARNA_MAPEL_DEFAULT: WarnaMapel = "emerald";

/** Warna tema aman untuk nilai tak dikenal / kelas tanpa mapel. */
export const WARNA_NETRAL: WarnaTema = {
  label: "Netral",
  badge: "bg-slate-100 text-slate-600 ring-slate-200",
  dot: "bg-slate-400",
  lembut: "bg-slate-50 ring-slate-200",
  teks: "text-slate-600",
  batang: "bg-slate-300",
};

export function temaMapel(warna?: string | null): WarnaTema {
  if (warna && warna in PALET_MAPEL) {
    return PALET_MAPEL[warna as WarnaMapel];
  }
  return WARNA_NETRAL;
}

/**
 * Pilih warna berikutnya yang belum dipakai, agar mapel baru otomatis
 * berbeda warna dari mapel yang sudah ada.
 */
export function warnaMapelSaran(warnaTerpakai: string[]): WarnaMapel {
  const dipakai = new Set(warnaTerpakai);
  return WARNA_MAPEL_LIST.find((w) => !dipakai.has(w)) ?? WARNA_MAPEL_DEFAULT;
}

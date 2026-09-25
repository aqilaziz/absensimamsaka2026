export interface SiswaPaste {
  nis?: string;
  nama: string;
  urutan: number;
}

export function parseExcelPaste(raw: string): SiswaPaste[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.split("\t")) // paste Excel = tab-separated
    .map(([a, b]) => {
      // Dukung 1 kolom (nama) atau 2 kolom (nis \t nama)
      const nis = b ? a.trim() : undefined;
      const nama = (b ?? a).trim();
      return { nis: nis || undefined, nama };
    })
    .filter((s) => s.nama.length > 0)
    .map((s, i) => ({ ...s, urutan: i + 1 }));
}

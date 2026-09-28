import { temaMapel } from "@/lib/mapel";
import type { Mapel } from "@/lib/types";

/**
 * Badge kecil penanda mata pelajaran. Warna mengikuti mapel sehingga satu
 * mapel selalu tampil dengan warna yang sama di mana pun ia muncul.
 */
export function MapelBadge({
  mapel,
  className = "",
}: {
  mapel?: Pick<Mapel, "nama" | "warna"> | null;
  className?: string;
}) {
  if (!mapel) return null;
  const t = temaMapel(mapel.warna);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${t.badge} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {mapel.nama}
    </span>
  );
}

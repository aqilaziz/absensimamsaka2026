"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Pemilih mata pelajaran untuk sesi absensi & jurnal.
 * Hanya tampil bila guru mengampu lebih dari satu mapel di kelas ini.
 */
export function PemilihMapel({
  kelasId,
  tanggal,
  mapelId,
  mapelList,
}: {
  kelasId: string;
  tanggal: string;
  mapelId: string;
  mapelList: { id: string; nama: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (mapelList.length <= 1) return null;

  return (
    <select
      value={mapelId}
      disabled={pending}
      aria-label="Mata pelajaran sesi ini"
      onChange={(e) =>
        startTransition(() => {
          router.push(
            `/kelas/${kelasId}/absensi?tanggal=${tanggal}&mapel=${e.target.value}`,
          );
        })
      }
      className="input w-full py-1.5 sm:w-auto"
    >
      {mapelList.map((m) => (
        <option key={m.id} value={m.id}>
          {m.nama}
        </option>
      ))}
    </select>
  );
}

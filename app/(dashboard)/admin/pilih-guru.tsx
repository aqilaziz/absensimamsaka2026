"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface OpsiGuru {
  id: string;
  nama: string;
  jumlahKelas: number;
}

/**
 * Pemilih guru untuk rekap admin. Dipakai dropdown karena daftar guru
 * (50+) tidak muat sebagai deretan chip.
 */
export function PilihGuru({
  tahunId,
  nilai,
  gurus,
  adaTanpaPengampu,
}: {
  tahunId: string;
  nilai: string;
  gurus: OpsiGuru[];
  adaTanpaPengampu: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function pilih(v: string) {
    const q = new URLSearchParams({ tahun: tahunId });
    if (v) q.set("guru", v);
    startTransition(() => {
      router.push(`/admin?${q.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-500">Guru</span>
      <div className="relative">
        <select
          value={nilai}
          onChange={(e) => pilih(e.target.value)}
          disabled={pending}
          className="input w-full min-w-[16rem] max-w-md py-1.5 pr-8 text-sm sm:min-w-[20rem]"
        >
          <option value="">Semua Guru</option>
          {gurus.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama}
              {g.jumlahKelas > 0 ? ` (${g.jumlahKelas} kelas)` : " (belum ada kelas)"}
            </option>
          ))}
          {adaTanpaPengampu && (
            <option value="belum">— Kelas belum ada pengampu —</option>
          )}
        </select>
        {pending && (
          <Loader2
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-emerald-600"
          />
        )}
      </div>
    </div>
  );
}

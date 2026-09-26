"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCopy, Loader2, X } from "lucide-react";
import { salinSiswaDariKelas } from "./actions";
import { toastSukses, toastGagal } from "@/lib/swal";
import { labelSemester } from "@/lib/periode";
import type { SemesterSumber } from "@/lib/santri";

/**
 * Tombol "Salin santri" pada halaman kelas.
 *
 * Semester ganjil biasanya berisi santri yang sama dengan semester genap
 * sebelumnya. Daripada mengimpor Excel lagi, guru bisa menyalin seluruh
 * daftar santri dari kelas semester sebelumnya dalam satu klik.
 */
export function SalinSantriButton({
  kelasId,
  sumber,
}: {
  kelasId: string;
  sumber: SemesterSumber;
}) {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const [sumberId, setSumberId] = useState(sumber.saranKelasId ?? "");
  const [memuat, startTransition] = useTransition();

  const pilihan = sumber.kelasList.find((k) => k.id === sumberId);

  function kirim() {
    if (!sumberId) return;
    startTransition(async () => {
      const hasil = await salinSiswaDariKelas({
        kelas_id: kelasId,
        kelas_sumber_id: sumberId,
      });
      if (!hasil.ok) {
        toastGagal(hasil.error ?? "Gagal menyalin santri");
        return;
      }
      const pesan = hasil.dilewati
        ? `${hasil.disalin} santri disalin, ${hasil.dilewati} dilewati (sudah ada)`
        : `${hasil.disalin} santri berhasil disalin`;
      toastSukses(pesan);
      setTerbuka(false);
      router.refresh();
    });
  }

  const labelSumber = `${labelSemester(sumber.semester.nama)} ${sumber.tahunNama}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setTerbuka(true)}
        className="btn-secondary w-full justify-center sm:w-auto"
      >
        <ClipboardCopy size={16} />
        Salin santri semester lalu
      </button>

      {terbuka && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="judul-salin-santri"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="judul-salin-santri"
                  className="text-base font-semibold text-slate-800"
                >
                  Salin santri
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Ambil daftar santri dari kelas semester sebelumnya ke kelas
                  ini. Santri yang sudah ada (NIS sama) otomatis dilewati.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTerbuka(false)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <label
              htmlFor="kelas-sumber"
              className="mt-4 block text-xs font-medium text-slate-600"
            >
              Sumber: {labelSumber}
            </label>
            <select
              id="kelas-sumber"
              value={sumberId}
              onChange={(e) => setSumberId(e.target.value)}
              className="input mt-1.5"
            >
              {sumber.kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama} · {k.jumlahSiswa} santri
                </option>
              ))}
            </select>

            {pilihan && pilihan.jumlahSiswa === 0 && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-100">
                Kelas sumber belum punya santri.
              </p>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setTerbuka(false)}
                className="btn-secondary justify-center"
                disabled={memuat}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={kirim}
                className="btn-primary justify-center"
                disabled={memuat || !sumberId || pilihan?.jumlahSiswa === 0}
              >
                {memuat ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Menyalin...
                  </>
                ) : (
                  "Salin sekarang"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importSiswa } from "../actions";
import { parseExcelPaste } from "@/lib/parse-excel-paste";

export function ImportForm({
  kelasId,
  namaSudahAda,
}: {
  kelasId: string;
  namaSudahAda: string[];
}) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const parsed = useMemo(() => parseExcelPaste(raw), [raw]);
  const sudahAda = useMemo(
    () => new Set(namaSudahAda.map((n) => n.toLowerCase())),
    [namaSudahAda],
  );

  function onSimpan() {
    if (parsed.length === 0) return;
    setError(null);
    startTransition(async () => {
      const res = await importSiswa({
        kelas_id: kelasId,
        items: parsed.map(({ nama, nis }) => ({ nama, nis })),
      });
      if (!res.ok) {
        setError(res.error ?? "Gagal mengimpor");
        return;
      }
      router.push(`/kelas/${kelasId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Tempel (paste) daftar nama dari Excel
          </span>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={8}
            className="input font-mono text-xs"
            placeholder={
              "Satu kolom (nama saja):\nAhmad Fauzi\nBudi Santoso\n\nAtau dua kolom (NIS ⇥ nama):\n1920.0345\tAhmad Fauzi\n1920.0346\tBudi Santoso"
            }
          />
        </label>
        <p className="text-xs text-slate-400">
          Tips: blok kolom nama di Excel, Ctrl+C, lalu Ctrl+V di sini. Kolom
          pertama dianggap NIS jika ada dua kolom.
        </p>
      </div>

      {parsed.length > 0 && (
        <div className="card space-y-3">
          <p className="text-sm font-semibold text-slate-900">
            Pratinjau: {parsed.length} santri
          </p>
          <div className="max-h-72 overflow-y-auto rounded-lg ring-1 ring-slate-200">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className="th w-12">No</th>
                  <th className="th">Nama</th>
                  <th className="th w-36">NIS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {parsed.map((s) => {
                  const duplikat = sudahAda.has(s.nama.toLowerCase());
                  return (
                    <tr key={s.urutan} className={duplikat ? "bg-amber-50" : ""}>
                      <td className="td text-slate-400">{s.urutan}</td>
                      <td className="td">
                        {s.nama}
                        {duplikat && (
                          <span className="ml-2 text-xs text-amber-600">
                            (nama sudah ada)
                          </span>
                        )}
                      </td>
                      <td className="td text-slate-500">{s.nis ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onSimpan}
              disabled={pending}
              className="btn-primary"
            >
              {pending ? "Menyimpan…" : `Simpan ${parsed.length} Santri`}
            </button>
            <button onClick={() => setRaw("")} className="btn-secondary">
              Kosongkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

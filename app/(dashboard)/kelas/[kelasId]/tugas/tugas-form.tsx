"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Paperclip, Upload, X } from "lucide-react";
import { createTugas, updateTugas, hapusTugas } from "./actions";
import { createClient } from "@/lib/supabase/client";
import type { Lampiran, Tugas } from "@/lib/types";
import { konfirmasiHapus, toastGagal, toastSukses } from "@/lib/swal";

const MAKS_BERKAS = 10;
const MAKS_UKURAN = 10 * 1024 * 1024; // 10 MB

function ukuranTeks(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TugasForm({
  kelasId,
  tugas,
  onClose,
}: {
  kelasId: string;
  tugas?: Tugas;
  onClose?: () => void;
}) {
  const [tipe, setTipe] = useState<"ceklis" | "nilai">(tugas?.tipe ?? "ceklis");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [lampiran, setLampiran] = useState<Lampiran[]>(tugas?.lampiran ?? []);
  const [mengunggah, setMengunggah] = useState(false);
  const [seret, setSeret] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function unggahBerkas(daftar: File[]) {
    if (daftar.length === 0) return;
    if (lampiran.length + daftar.length > MAKS_BERKAS) {
      setError(`Maksimal ${MAKS_BERKAS} berkas per tugas.`);
      return;
    }

    setError(null);
    setMengunggah(true);
    const supabase = createClient();
    const berhasil: Lampiran[] = [];

    for (const f of daftar) {
      if (f.size > MAKS_UKURAN) {
        setError(`"${f.name}" lebih dari 10 MB, dilewati.`);
        continue;
      }
      const aman = f.name.replace(/[^\w.\-]+/g, "_");
      const path = `${kelasId}/${crypto.randomUUID()}-${aman}`;
      const { error: err } = await supabase.storage
        .from("tugas")
        .upload(path, f, { upsert: false, contentType: f.type || undefined });
      if (err) {
        setError(`Gagal mengunggah "${f.name}": ${err.message}`);
        continue;
      }
      berhasil.push({
        nama: f.name,
        path,
        ukuran: f.size,
        tipe: f.type || "application/octet-stream",
      });
    }

    setLampiran((prev) => [...prev, ...berhasil]);
    setMengunggah(false);
    if (berhasil.length > 0) toastSukses(`${berhasil.length} berkas diunggah`);
  }

  async function buangLampiran(l: Lampiran) {
    setLampiran((prev) => prev.filter((x) => x.path !== l.path));
    const supabase = createClient();
    await supabase.storage.from("tugas").remove([l.path]);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (mengunggah) {
      setError("Tunggu unggahan berkas selesai.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const input = {
      judul: String(fd.get("judul")),
      deskripsi: String(fd.get("deskripsi") ?? "") || undefined,
      tipe,
      nilai_maks:
        tipe === "nilai" && fd.get("nilai_maks")
          ? Number(fd.get("nilai_maks"))
          : undefined,
      tgl_diberikan: String(fd.get("tgl_diberikan")),
      tgl_tenggat: String(fd.get("tgl_tenggat") ?? "") || undefined,
      lampiran,
    };
    setError(null);
    startTransition(async () => {
      if (tugas) {
        const res = await updateTugas(tugas.id, kelasId, input);
        if (!res.ok) {
          setError(res.error ?? "Gagal menyimpan");
          return;
        }
        onClose?.();
        router.refresh();
      } else {
        const res = await createTugas(kelasId, input);
        if (!res.ok) {
          setError(res.error ?? "Gagal menyimpan");
          return;
        }
        router.push(`/kelas/${kelasId}/tugas/${res.tugasId}`);
        router.refresh();
      }
    });
  }

  async function onHapus() {
    if (!tugas) return;
    const yakin = await konfirmasiHapus({
      teks: `Hapus tugas "${tugas.judul}" beserta seluruh pengumpulannya?`,
    });
    if (!yakin) return;
    setError(null);
    startTransition(async () => {
      const res = await hapusTugas(tugas.id, kelasId);
      if (!res.ok) {
        const pesan = res.error ?? "Gagal menghapus";
        setError(pesan);
        toastGagal(pesan);
        return;
      }
      toastSukses("Tugas dihapus");
      router.push(`/kelas/${kelasId}/tugas`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Judul tugas / kegiatan
          </span>
          <input
            name="judul"
            required
            defaultValue={tugas?.judul}
            className="input"
            placeholder="mis. LKPD Bab 3 - Fungsi"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Deskripsi / instruksi (bebas, tanpa batas karakter)
          </span>
          <textarea
            name="deskripsi"
            rows={5}
            defaultValue={tugas?.deskripsi ?? ""}
            className="input resize-y"
            placeholder="Tulis instruksi lengkap, boleh sepanjang yang diperlukan…"
          />
        </label>

        <div>
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Tipe penilaian
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTipe("ceklis")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                tipe === "ceklis"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 text-slate-500 hover:border-slate-400"
              }`}
            >
              Ceklis saja
            </button>
            <button
              type="button"
              onClick={() => setTipe("nilai")}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                tipe === "nilai"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 text-slate-500 hover:border-slate-400"
              }`}
            >
              Dengan nilai
            </button>
          </div>
        </div>

        {tipe === "nilai" && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Nilai maksimal
            </span>
            <input
              name="nilai_maks"
              type="number"
              min={1}
              step="any"
              required
              defaultValue={tugas?.nilai_maks ?? 100}
              className="input"
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Tanggal diberikan
          </span>
          <input
            name="tgl_diberikan"
            type="date"
            required
            defaultValue={
              tugas?.tgl_diberikan ?? format(new Date(), "yyyy-MM-dd")
            }
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Tenggat (opsional)
          </span>
          <input
            name="tgl_tenggat"
            type="date"
            defaultValue={tugas?.tgl_tenggat ?? ""}
            className="input"
          />
        </label>
      </div>

      {/* ===== Lampiran berkas ===== */}
      <div>
        <span className="mb-1 block text-xs font-medium text-slate-600">
          Lampiran berkas (opsional)
        </span>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setSeret(true);
          }}
          onDragLeave={() => setSeret(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSeret(false);
            void unggahBerkas(Array.from(e.dataTransfer.files));
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
            seret
              ? "border-emerald-500 bg-emerald-50"
              : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/40"
          }`}
        >
          <Upload size={20} className="text-emerald-600" />
          <p className="text-sm font-medium text-slate-700">
            {mengunggah ? "Mengunggah…" : "Tarik berkas ke sini atau klik"}
          </p>
          <p className="text-[11px] text-slate-400">
            PDF, Word, Excel, gambar — maks. 10 MB per berkas, hingga{" "}
            {MAKS_BERKAS} berkas
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              void unggahBerkas(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>

        {lampiran.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {lampiran.map((l) => (
              <li
                key={l.path}
                className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200"
              >
                <Paperclip size={14} className="shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate text-slate-700">
                  {l.nama}
                </span>
                <span className="shrink-0 text-[11px] text-slate-400">
                  {ukuranTeks(l.ukuran)}
                </span>
                <button
                  type="button"
                  onClick={() => void buangLampiran(l)}
                  title="Hapus berkas"
                  className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending || mengunggah}
          className="btn-primary"
        >
          {pending ? "Menyimpan…" : tugas ? "Simpan Perubahan" : "Simpan Tugas"}
        </button>
        {onClose && (
          <button type="button" onClick={onClose} className="btn-secondary">
            Batal
          </button>
        )}
        {tugas && (
          <button
            type="button"
            onClick={onHapus}
            disabled={pending}
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            Hapus Tugas
          </button>
        )}
      </div>
    </form>
  );
}

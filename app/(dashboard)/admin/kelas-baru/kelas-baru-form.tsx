"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminBuatKelas } from "../actions";
import { parseExcelPaste } from "@/lib/parse-excel-paste";
import { formatTanggal } from "@/lib/periode";
import type { Semester, TahunPelajaran } from "@/lib/types";

const BARU = "__baru__";

interface Props {
  tahunList: TahunPelajaran[];
  semList: Semester[];
}

export function KelasBaruForm({ tahunList, semList }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Tahun: '' = belum pilih, id = pakai yang ada, BARU = buat baru.
  const [tahunId, setTahunId] = useState("");
  const [semesterId, setSemesterId] = useState("");

  // Field untuk tahun bersama baru (semester dibuat otomatis oleh trigger).
  const [tahunBaru, setTahunBaru] = useState({
    nama: "",
    tgl_mulai: "",
    batas_semester: "",
    tgl_selesai: "",
  });
  const [semesterNama, setSemesterNama] = useState<"ganjil" | "genap">(
    "ganjil",
  );

  const [namaKelas, setNamaKelas] = useState("");
  const [rawSiswa, setRawSiswa] = useState("");

  // Rombel memakai tahun aktif; bila belum ada, admin membuat tahun baru.
  const tahunTersedia = useMemo(
    () => tahunList.filter((t) => t.status === "aktif"),
    [tahunList],
  );

  const semesterByTahun = useMemo(() => {
    const m = new Map<string, Semester[]>();
    for (const s of semList) {
      const arr = m.get(s.tahun_pelajaran_id) ?? [];
      arr.push(s);
      m.set(s.tahun_pelajaran_id, arr);
    }
    return m;
  }, [semList]);

  const semesterTahun = tahunId ? (semesterByTahun.get(tahunId) ?? []) : [];

  const parsed = useMemo(() => parseExcelPaste(rawSiswa), [rawSiswa]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const buatTahunBaru = tahunId === BARU;
    if (!buatTahunBaru && !tahunId) {
      setError("Pilih atau buat tahun pelajaran dulu");
      return;
    }
    if (!buatTahunBaru && !semesterId) {
      setError("Pilih semester dulu");
      return;
    }

    if (parsed.length === 0) {
      setError("Masukkan minimal 1 nama santri");
      return;
    }

    const input: {
      tahun_pelajaran_id?: string;
      tahun_baru?: typeof tahunBaru;
      semester_id?: string;
      semester_nama?: "ganjil" | "genap";
      nama: string;
      items: { nama: string; nis?: string }[];
    } = {
      nama: String(fd.get("nama") ?? "").trim(),
      items: parsed.map(({ nama, nis }) => ({ nama, nis })),
    };

    if (buatTahunBaru) {
      input.tahun_baru = tahunBaru;
      input.semester_nama = semesterNama;
    } else {
      input.tahun_pelajaran_id = tahunId;
      input.semester_id = semesterId;
    }

    setError(null);
    startTransition(async () => {
      const res = await adminBuatKelas(input);
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan");
        return;
      }
      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* ===== Tahun & semester ===== */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">
          Tahun pelajaran & semester
        </h2>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Tahun pelajaran (bersama)
          </span>
          <select
            value={tahunId}
            onChange={(e) => {
              setTahunId(e.target.value);
              setSemesterId("");
            }}
            required
            className="input w-full sm:w-80"
          >
            <option value="" disabled>
              {tahunTersedia.length === 0
                ? "— belum ada tahun aktif —"
                : "— Pilih tahun pelajaran —"}
            </option>
            {tahunTersedia.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nama}
                {t.status === "aktif" ? " (aktif)" : ""}
              </option>
            ))}
            {/* Hanya satu tahun aktif untuk seluruh madrasah, jadi opsi
                membuat tahun baru muncul saat belum ada tahun aktif. */}
            {tahunTersedia.length === 0 && (
              <option value={BARU}>+ Tahun pelajaran baru…</option>
            )}
          </select>
        </label>

        {tahunId === BARU ? (
          <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200 space-y-4">
            <p className="text-xs text-slate-500">
              Tahun baru akan dibuat BERSAMA (bisa dipakai semua guru). Kedua
              semester (Ganjil & Genap) dibuat otomatis.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Nama tahun (mis. 2026/2027)
                </span>
                <input
                  required
                  className="input w-full"
                  placeholder="2026/2027"
                  value={tahunBaru.nama}
                  onChange={(e) =>
                    setTahunBaru((v) => ({ ...v, nama: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Semester kelas ini
                </span>
                <select
                  value={semesterNama}
                  onChange={(e) =>
                    setSemesterNama(e.target.value as "ganjil" | "genap")
                  }
                  className="input w-full"
                >
                  <option value="ganjil">Ganjil</option>
                  <option value="genap">Genap</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Tanggal mulai
                </span>
                <input
                  type="date"
                  required
                  className="input w-full"
                  value={tahunBaru.tgl_mulai}
                  onChange={(e) =>
                    setTahunBaru((v) => ({ ...v, tgl_mulai: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Batas semester ganjil
                </span>
                <input
                  type="date"
                  required
                  className="input w-full"
                  value={tahunBaru.batas_semester}
                  onChange={(e) =>
                    setTahunBaru((v) => ({
                      ...v,
                      batas_semester: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Tanggal selesai
                </span>
                <input
                  type="date"
                  required
                  className="input w-full"
                  value={tahunBaru.tgl_selesai}
                  onChange={(e) =>
                    setTahunBaru((v) => ({
                      ...v,
                      tgl_selesai: e.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </div>
        ) : (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Semester
            </span>
            <select
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
              disabled={semesterTahun.length === 0}
              required
              className="input w-full sm:w-96"
            >
              <option value="" disabled>
                {semesterTahun.length === 0
                  ? "— pilih tahun dulu —"
                  : "— Pilih semester —"}
              </option>
              {semesterTahun.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama === "genap" ? "Genap" : "Ganjil"} ·{" "}
                  {formatTanggal(s.tgl_mulai)} – {formatTanggal(s.tgl_selesai)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* ===== Nama kelas ===== */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">
          Nama kelas (rombel)
        </h2>

        <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800 ring-1 ring-sky-100">
          Kelas dibuat sebagai rombel (belum ada mapel). Guru nanti mencentang
          sendiri kelas ini beserta mapel yang ia ampu di menu{" "}
          <b>Ambil Kelas</b>.
        </p>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Nama kelas (mis. XII IPA 1)
          </span>
          <input
            name="nama"
            required
            value={namaKelas}
            onChange={(e) => setNamaKelas(e.target.value)}
            className="input w-full sm:w-64"
            placeholder="XII IPA 1"
          />
        </label>
      </div>

      {/* ===== Siswa ===== */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">Daftar santri</h2>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Tempel (paste) daftar nama dari Excel
          </span>
          <textarea
            value={rawSiswa}
            onChange={(e) => setRawSiswa(e.target.value)}
            rows={6}
            className="input w-full font-mono text-xs"
            placeholder={
              "Satu kolom (nama saja):\nAhmad Fauzi\nBudi Santoso\n\nAtau dua kolom (NIS ⇥ nama):\n1920.0345\tAhmad Fauzi\n1920.0346\tBudi Santoso"
            }
          />
        </label>
        <p className="text-xs text-slate-400">
          Tips: blok kolom nama di Excel, Ctrl+C, lalu Ctrl+V di sini. Kolom
          pertama dianggap NIS jika ada dua kolom.
        </p>

        {parsed.length > 0 && (
          <div className="max-h-60 overflow-y-auto rounded-lg ring-1 ring-slate-200">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className="th w-12">No</th>
                  <th className="th">Nama</th>
                  <th className="th w-36">NIS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {parsed.map((s) => (
                  <tr key={s.urutan}>
                    <td className="td text-slate-400">{s.urutan}</td>
                    <td className="td">{s.nama}</td>
                    <td className="td text-slate-500">{s.nis ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending
            ? "Menyimpan…"
            : `Simpan Kelas${parsed.length > 0 ? ` + ${parsed.length} Santri` : ""}`}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="btn-secondary"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminBuatKelas } from "../actions";
import { parseExcelPaste } from "@/lib/parse-excel-paste";
import { formatTanggal } from "@/lib/periode";
import { PALET_MAPEL, WARNA_MAPEL_LIST, warnaMapelSaran } from "@/lib/mapel";
import type { Mapel, Semester, TahunPelajaran, WarnaMapel } from "@/lib/types";

const BARU = "__baru__";

interface Props {
  tahunList: TahunPelajaran[];
  semList: Semester[];
  mapelList: Mapel[];
}

export function KelasBaruForm({ tahunList, semList, mapelList }: Props) {
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

  const [mapelId, setMapelId] = useState("");
  const [warnaBaru, setWarnaBaru] = useState<WarnaMapel>("emerald");
  const [namaKelas, setNamaKelas] = useState("");
  const [rawSiswa, setRawSiswa] = useState("");

  // Hanya data BERSAMA (dibuat admin) yang bisa dipakai untuk kelas bersama.
  const tahunBersama = useMemo(
    () => tahunList.filter((t) => t.guru_id === null),
    [tahunList],
  );
  const mapelBersama = useMemo(
    () => mapelList.filter((m) => m.guru_id === null),
    [mapelList],
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

  const saranWarna = useMemo(
    () => warnaMapelSaran(mapelBersama.map((m) => m.warna)),
    [mapelBersama],
  );

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

    const mapelBaruNamaVal = String(fd.get("mapel_baru") ?? "").trim();
    if (mapelId === BARU && !mapelBaruNamaVal) {
      setError("Isi nama mata pelajaran baru");
      return;
    }
    if (!mapelId) {
      setError("Pilih atau buat mata pelajaran dulu");
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
      mapel_id?: string;
      mapel_baru?: { nama: string; warna: WarnaMapel };
      nama: string;
      items: { nama: string; nis?: string }[];
    } = {
      mapel_id: mapelId !== BARU ? mapelId : undefined,
      mapel_baru:
        mapelId === BARU
          ? { nama: mapelBaruNamaVal, warna: warnaBaru }
          : undefined,
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
              {tahunBersama.length === 0
                ? "— belum ada tahun bersama —"
                : "— Pilih tahun (atau buat baru) —"}
            </option>
            {tahunBersama.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nama}
                {t.status === "aktif" ? " (aktif)" : ""}
              </option>
            ))}
            <option value={BARU}>+ Tahun pelajaran baru…</option>
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

      {/* ===== Mapel & nama kelas ===== */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">
          Mata pelajaran & nama kelas
        </h2>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Mata pelajaran (bersama)
          </span>
          <select
            value={mapelId}
            onChange={(e) => {
              setMapelId(e.target.value);
              if (e.target.value !== BARU) setWarnaBaru(saranWarna);
            }}
            required
            className="input w-full sm:w-72"
          >
            <option value="" disabled>
              {mapelBersama.length === 0
                ? "— belum ada mapel bersama —"
                : "— Pilih mapel (atau buat baru) —"}
            </option>
            {mapelBersama.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nama}
              </option>
            ))}
            <option value={BARU}>+ Mata pelajaran baru…</option>
          </select>
        </label>

        {mapelId === BARU && (
          <div className="flex flex-wrap items-end gap-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Nama mapel baru
              </span>
              <input
                name="mapel_baru"
                required
                className="input w-full sm:w-56"
                placeholder="mis. Matematika"
              />
            </label>
            <div>
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Warna tema
              </span>
              <div className="flex flex-wrap gap-1.5">
                {WARNA_MAPEL_LIST.map((w) => {
                  const t = PALET_MAPEL[w];
                  return (
                    <button
                      key={w}
                      type="button"
                      title={t.label}
                      aria-label={`Warna ${t.label}`}
                      onClick={() => setWarnaBaru(w)}
                      className={`h-8 w-8 rounded-full ${t.dot} ${
                        warnaBaru === w
                          ? "ring-2 ring-slate-800 ring-offset-2"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

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

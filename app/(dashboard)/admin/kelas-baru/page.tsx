import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";
import { KelasBaruForm } from "./kelas-baru-form";
import type { Semester, TahunPelajaran } from "@/lib/types";

export default async function AdminKelasBaruPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [tahunRes, semRes] = await Promise.all([
    supabase.from("tahun_pelajaran").select("*").order("tgl_mulai", {
      ascending: false,
    }),
    supabase.from("semester").select("*").order("urutan"),
  ]);

  const tahunList = (tahunRes.data ?? []) as TahunPelajaran[];
  const semList = (semRes.data ?? []) as Semester[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Buat Kelas (Admin)
          </h1>
          <p className="text-sm text-slate-500">
            Siapkan rombel beserta daftar santrinya. Guru nanti mencentang kelas
            ini dan memilih mapel yang ia ampu lewat menu Ambil Kelas.
          </p>
        </div>
        <Link href="/admin" className="btn-secondary">
          ← Kembali ke Dashboard
        </Link>
      </div>

      <KelasBaruForm tahunList={tahunList} semList={semList} />
    </div>
  );
}

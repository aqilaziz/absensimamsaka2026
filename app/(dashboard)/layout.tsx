import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "@/components/nav-link";
import { logout } from "./actions";
import { labelSemester, semesterAktifHariIni } from "@/lib/periode";
import { ambilKelasSaya, type KelasRingkas } from "@/lib/kelas";
import { ambilProfilSendiri } from "@/lib/profil";
import type { Profile, Semester, TahunPelajaran } from "@/lib/types";
import {
  Archive,
  CalendarRange,
  CheckSquare,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Search,
  Shield,
  Users,
} from "lucide-react";

// Sidebar dimuat terpisah agar tidak memblokir render halaman.
// Sebelumnya layout menunggu 4 query Supabase sebelum children bisa tampil,
// sehingga setiap klik menu terasa menggantung.
async function SidebarContent({ profil }: { profil: Profile | null }) {
  const supabase = await createClient();

  const isAdmin = profil?.role === "admin";
  // Hanya ada satu tahun pelajaran aktif untuk seluruh madrasah.
  const { data: aktifList } = await supabase
    .from("tahun_pelajaran")
    .select("*")
    .eq("status", "aktif");
  const aktif = (aktifList ?? []) as TahunPelajaran[];
  const tahun = aktif[0] ?? null;

  let kelasList: KelasRingkas[] = [];
  let semesters: Semester[] = [];
  if (tahun) {
    // Semester & daftar kelas dijalankan bersamaan — keduanya hanya butuh
    // id tahun, jadi tidak perlu menunggu satu sama lain.
    const kelasQuery = isAdmin
      ? supabase
          .from("kelas")
          .select("id, nama, semester_id")
          .eq("tahun_pelajaran_id", tahun.id)
          .order("nama")
      : profil?.id
        ? // Guru hanya melihat kelas yang ia centang di halaman "Ambil Kelas".
          ambilKelasSaya(supabase, profil.id, tahun.id)
        : Promise.resolve([] as KelasRingkas[]);

    const [semData, kelasData] = await Promise.all([
      supabase
        .from("semester")
        .select("*")
        .eq("tahun_pelajaran_id", tahun.id)
        .order("urutan"),
      kelasQuery,
    ]);

    semesters = (semData.data ?? []) as Semester[];
    kelasList = (kelasData ?? []) as KelasRingkas[];
  }

  const semesterBerjalan = tahun
    ? (semesters.find((s) => s.nama === semesterAktifHariIni(tahun)) ?? null)
    : null;

  return (
    <>
      <div className="flex items-center gap-3 px-5 pb-3 pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logomam1.png"
          alt="Logo MAM 1 Paciran"
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-full bg-white object-contain p-0.5"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight text-white">
            MAM 1 Paciran
          </p>
          <p className="truncate text-xs text-emerald-200/70">
            {profil?.nama ?? "Guru"}
          </p>
        </div>
      </div>

      {/* Akun & keluar di bagian atas supaya selalu terlihat tanpa menggulir. */}
      <div className="flex items-center gap-2 px-4 pb-4">
        <Link
          href="/akun"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-900/70 px-2 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-800 hover:text-white"
        >
          <KeyRound size={13} /> Akun &amp; Sandi
        </Link>
        <form action={logout} className="flex-1">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
          >
            <LogOut size={13} /> Keluar
          </button>
        </form>
      </div>

      <div className="mx-4 rounded-lg bg-emerald-900/60 px-3 py-2">
        <p className="text-[11px] uppercase tracking-wide text-emerald-300/70">
          Tahun Pelajaran Aktif
        </p>
        <p className="text-sm font-semibold text-emerald-50">
          {tahun ? tahun.nama : "Belum ada"}
        </p>
        {semesterBerjalan && (
          <p className="mt-0.5 text-[11px] font-medium text-emerald-200/80">
            {labelSemester(semesterBerjalan.nama)}
          </p>
        )}
      </div>

      <nav className="mt-4 space-y-1 px-3">
        <NavLink href="/" exact>
          <span className="flex items-center gap-2">
            <LayoutDashboard size={16} /> Dashboard
          </span>
        </NavLink>
        {isAdmin && (
          <NavLink href="/tahun-pelajaran">
            <span className="flex items-center gap-2">
              <CalendarRange size={16} /> Tahun Pelajaran
            </span>
          </NavLink>
        )}
        <NavLink href="/kelas" exact>
          <span className="flex items-center gap-2">
            <Users size={16} /> Kelas
          </span>
        </NavLink>
        {!isAdmin && (
          <NavLink href="/ambil-kelas">
            <span className="flex items-center gap-2">
              <CheckSquare size={16} /> Ambil Kelas
            </span>
          </NavLink>
        )}
        <NavLink href="/cari-santri">
          <span className="flex items-center gap-2">
            <Search size={16} /> Cari Santri
          </span>
        </NavLink>
        <NavLink href="/arsip">
          <span className="flex items-center gap-2">
            <Archive size={16} /> Arsip
          </span>
        </NavLink>
        {isAdmin && (
          <NavLink href="/admin">
            <span className="flex items-center gap-2">
              <Shield size={16} /> Admin
            </span>
          </NavLink>
        )}
      </nav>

      {kelasList.length > 0 && (
        <div className="mt-5 px-3">
          <p className="mb-1 px-3 text-[11px] uppercase tracking-wide text-emerald-300/70">
            Kelas
          </p>
          {semesters.length > 0 ? (
            semesters.map((s) => {
              const items = kelasList.filter((k) => k.semester_id === s.id);
              if (items.length === 0) return null;
              return (
                <div key={s.id} className="mb-2">
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wide text-emerald-300/60">
                    {labelSemester(s.nama)}
                  </p>
                  <div className="space-y-1">
                    {items.map((k) => (
                      <NavLink key={k.id} href={`/kelas/${k.id}/absensi`}>
                        <span className="flex items-center gap-2 truncate">
                          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500/60" />
                          <span className="truncate">{k.nama}</span>
                        </span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="space-y-1">
              {kelasList.map((k) => (
                <NavLink key={k.id} href={`/kelas/${k.id}/absensi`}>
                  <span className="flex items-center gap-2 truncate">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500/60" />
                    <span className="truncate">{k.nama}</span>
                  </span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="pb-4" />
    </>
  );
}

function SidebarSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-6 w-32 rounded bg-emerald-800/60" />
      <div className="h-12 rounded-lg bg-emerald-800/40" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 rounded-lg bg-emerald-800/40" />
        ))}
      </div>
    </div>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Profil diambil SEKALI di sini lalu diteruskan ke sidebar — sebelumnya
  // layout dan sidebar masing-masing memanggil getUser() + query profil,
  // sehingga setiap navigasi membayar dua round-trip ekstra.
  const supabase = await createClient();
  const profil = await ambilProfilSendiri(supabase);
  const isAdmin = profil?.role === "admin";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop — dimuat terpisah agar children tidak menunggu. */}
      <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto bg-emerald-950 md:flex">
        <Suspense fallback={<SidebarSkeleton />}>
          <SidebarContent profil={profil} />
        </Suspense>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile */}
        <header className="no-scrollbar sticky top-0 z-20 flex items-center gap-3 overflow-x-auto bg-emerald-950 px-4 py-3 md:hidden">
          <div className="flex shrink-0 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logomam1.png"
              alt="Logo MAM 1 Paciran"
              width={28}
              height={28}
              className="h-7 w-7 rounded-full bg-white object-contain p-0.5"
            />
            <span className="font-bold leading-tight text-white">
              MAM 1 Paciran
            </span>
          </div>
          <nav className="flex shrink-0 items-center gap-1 text-sm">
            <NavLink href="/" exact>
              Dashboard
            </NavLink>
            <NavLink href="/kelas" exact>
              Kelas
            </NavLink>
            {!isAdmin && <NavLink href="/ambil-kelas">Ambil</NavLink>}
            <NavLink href="/cari-santri">Cari</NavLink>
            <NavLink href="/arsip">Arsip</NavLink>
            <NavLink href="/akun">Akun</NavLink>
            <form action={logout} className="shrink-0 pl-1">
              <button
                type="submit"
                className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-red-700"
              >
                Keluar
              </button>
            </form>
          </nav>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

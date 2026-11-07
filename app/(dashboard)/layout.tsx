import { Suspense, cache } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "@/components/nav-link";
import { MobileMenu } from "@/components/mobile-menu";
import { BottomNav } from "@/components/bottom-nav";
import { NavRail } from "@/components/nav-rail";
import { logout } from "./actions";
import { labelSemester, semesterAktifHariIni } from "@/lib/periode";
import { ambilKelasSaya, type KelasRingkas } from "@/lib/kelas";
import { ambilProfilSendiri } from "@/lib/profil";
import type { Semester, TahunPelajaran } from "@/lib/types";
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

/**
 * Data navigasi dipakai bersama sidebar desktop, navigation rail tablet,
 * dan top bar HP. Dibungkus React `cache()` agar ketiganya tidak melakukan
 * query Supabase yang sama berulang kali dalam satu request.
 */
const ambilNavigasi = cache(async () => {
  const supabase = await createClient();
  const profil = await ambilProfilSendiri(supabase);
  const isAdmin = profil?.role === "admin";
  // Hanya ada satu tahun pelajaran aktif untuk seluruh madrasah.
  const { data: aktifList } = await supabase
    .from("tahun_pelajaran")
    .select("*")
    .eq("status", "aktif");
  const tahun = ((aktifList ?? []) as TahunPelajaran[])[0] ?? null;

  let kelasList: KelasRingkas[] = [];
  let semesters: Semester[] = [];
  if (tahun) {
    // Semester & daftar kelas dijalankan bersamaan — keduanya hanya butuh
    // id tahun, jadi tidak perlu menunggu satu sama lain.
    // Admin memakai respons PostgREST ({ data }), guru memakai array dari
    // `ambilKelasSaya` — disamakan setelah await.
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
    kelasList = Array.isArray(kelasData)
      ? (kelasData as KelasRingkas[])
      : (((kelasData as { data?: KelasRingkas[] | null }).data ??
          []) as KelasRingkas[]);
  }

  const semesterBerjalan = tahun
    ? (semesters.find((s) => s.nama === semesterAktifHariIni(tahun)) ?? null)
    : null;

  return { profil, isAdmin, tahun, semesters, kelasList, semesterBerjalan };
});

// Sidebar dimuat terpisah agar tidak memblokir render halaman.
// Sebelumnya layout menunggu 4 query Supabase sebelum children bisa tampil,
// sehingga setiap klik menu terasa menggantung.
async function SidebarContent() {
  const { profil, isAdmin, tahun, semesters, kelasList, semesterBerjalan } =
    await ambilNavigasi();

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
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/10 px-2 py-2 text-xs font-semibold text-red-200 ring-1 ring-red-300/20 transition hover:bg-red-500/15 active:scale-[0.98]"
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

/** Topbar khusus layar kecil. Dibuat komponen sendiri agar peran pengguna
 *  dimuat di dalam Suspense — tidak menahan render halaman. */
async function TopbarMobile() {
  const { profil, isAdmin, tahun, semesters, kelasList, semesterBerjalan } =
    await ambilNavigasi();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logomam1.png"
              alt="Logo MAM 1 Paciran"
              width={30}
              height={30}
              className="h-8 w-8 rounded-lg bg-white object-contain p-0.5"
            />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold leading-tight text-slate-900">
              MAM 1 Paciran
            </p>
            <p className="truncate text-[11px] leading-tight text-slate-400">
              {tahun?.nama ?? "Absensi Santri"}
              {semesterBerjalan
                ? ` · ${labelSemester(semesterBerjalan.nama)}`
                : ""}
            </p>
          </div>
        </div>

        <MobileMenu
          nama={profil?.nama ?? "Guru"}
          isAdmin={isAdmin}
          tahunNama={tahun?.nama ?? null}
          semesterLabel={
            semesterBerjalan ? labelSemester(semesterBerjalan.nama) : null
          }
          semesters={semesters.map((sm) => ({ id: sm.id, nama: sm.nama }))}
          kelas={kelasList.map((k) => ({
            id: k.id,
            nama: k.nama,
            semester_id: k.semester_id,
          }))}
          logoutAction={logout}
        />
      </div>
    </header>
  );
}

/** Navigation rail untuk tablet: data sama, tampilan ringkas. */
async function RailContent() {
  const { profil, isAdmin, tahun, semesters, kelasList, semesterBerjalan } =
    await ambilNavigasi();

  return (
    <NavRail
      nama={profil?.nama ?? "Guru"}
      isAdmin={isAdmin}
      tahunNama={tahun?.nama ?? null}
      semesterLabel={
        semesterBerjalan ? labelSemester(semesterBerjalan.nama) : null
      }
      semesters={semesters.map((sm) => ({ id: sm.id, nama: sm.nama }))}
      kelas={kelasList.map((k) => ({
        id: k.id,
        nama: k.nama,
        semester_id: k.semester_id,
      }))}
      logoutAction={logout}
    />
  );
}

function RailSkeleton() {
  return (
    <div className="hidden w-20 shrink-0 flex-col items-center gap-3 border-r border-slate-200 bg-white py-4 md:flex lg:hidden">
      <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-8 w-14 animate-pulse rounded-full bg-slate-100" />
      ))}
    </div>
  );
}

function TopbarSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
      <div className="h-9 w-9 rounded-xl bg-slate-100" />
      <div className="h-4 w-28 rounded bg-slate-100" />
      <div className="ml-auto h-9 w-9 rounded-full bg-slate-100" />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sengaja TANPA await: halaman (children) langsung dirender, sedangkan
  // profil/sidebar dimuat menyusul di dalam Suspense. Sebelumnya layout
  // menunggu query profil dulu sehingga setiap navigasi tertahan ~200-400 ms.
  return (
    <div className="flex min-h-screen">
      {/* Desktop ≥1024px: sidebar penuh. */}
      <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto bg-gradient-to-b from-emerald-950 via-emerald-950 to-emerald-900 lg:flex">
        <Suspense fallback={<SidebarSkeleton />}>
          <SidebarContent />
        </Suspense>
      </aside>

      {/* Tablet 768–1023px: navigation rail Material 3 (ikon saja). */}
      <Suspense fallback={<RailSkeleton />}>
        <RailContent />
      </Suspense>

      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<TopbarSkeleton />}>
          <TopbarMobile />
        </Suspense>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-6 md:p-8">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

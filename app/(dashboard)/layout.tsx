import { createClient } from "@/lib/supabase/server";
import { NavLink } from "@/components/nav-link";
import { logout } from "./actions";
import type { Kelas, Profile, TahunPelajaran } from "@/lib/types";
import {
  Archive,
  CalendarRange,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Search,
  Users,
} from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .single();

  const { data: tahunAktif } = await supabase
    .from("tahun_pelajaran")
    .select("*")
    .eq("status", "aktif")
    .maybeSingle();

  let kelasList: Kelas[] = [];
  if (tahunAktif) {
    const { data } = await supabase
      .from("kelas")
      .select("*")
      .eq("tahun_pelajaran_id", (tahunAktif as TahunPelajaran).id)
      .order("nama");
    kelasList = (data ?? []) as Kelas[];
  }

  const profil = profile as Profile | null;
  const tahun = tahunAktif as TahunPelajaran | null;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col bg-emerald-950 md:flex">
        <div className="px-5 py-5">
          <p className="text-lg font-bold text-white">Absensi Santri</p>
          <p className="text-xs text-emerald-200/70">{profil?.nama ?? "Guru"}</p>
        </div>

        <div className="mx-4 rounded-lg bg-emerald-900/60 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-emerald-300/70">
            Tahun Pelajaran Aktif
          </p>
          <p className="text-sm font-semibold text-emerald-50">
            {tahun ? tahun.nama : "Belum ada"}
          </p>
        </div>

        <nav className="mt-4 space-y-1 px-3">
          <NavLink href="/" exact>
            <span className="flex items-center gap-2">
              <LayoutDashboard size={16} /> Dashboard
            </span>
          </NavLink>
          <NavLink href="/tahun-pelajaran">
            <span className="flex items-center gap-2">
              <CalendarRange size={16} /> Tahun Pelajaran
            </span>
          </NavLink>
          <NavLink href="/kelas" exact>
            <span className="flex items-center gap-2">
              <Users size={16} /> Kelas
            </span>
          </NavLink>
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
        </nav>

        {kelasList.length > 0 && (
          <div className="mt-5 px-3">
            <p className="mb-1 px-3 text-[11px] uppercase tracking-wide text-emerald-300/70">
              Kelas Anda
            </p>
            <div className="space-y-1">
              {kelasList.map((k) => (
                <NavLink key={k.id} href={`/kelas/${k.id}`}>
                  <span className="flex items-center gap-2">
                    <ClipboardList size={14} /> {k.nama}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto p-3">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-emerald-100/80 transition hover:bg-emerald-800/60 hover:text-white"
            >
              <LogOut size={16} /> Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile */}
        <header className="flex items-center gap-3 overflow-x-auto bg-emerald-950 px-4 py-3 md:hidden">
          <span className="shrink-0 font-bold text-white">Absensi Santri</span>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink href="/" exact>Dashboard</NavLink>
            <NavLink href="/kelas" exact>Kelas</NavLink>
            <NavLink href="/cari-santri">Cari</NavLink>
            <NavLink href="/arsip">Arsip</NavLink>
          </nav>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

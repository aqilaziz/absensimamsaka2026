import { createClient } from "@/lib/supabase/server";
import { GantiPasswordForm } from "./ganti-password-form";
import type { Profile } from "@/lib/types";

export default async function AkunPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase.from("profiles").select("*").single();
  const profil = data as Profile | null;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Akun</h1>
        <p className="text-sm text-slate-500">
          Informasi akun dan pengaturan kata sandi Anda.
        </p>
      </div>

      <div className="card space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Nama</span>
          <span className="text-right font-medium text-slate-900">
            {profil?.nama ?? "—"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Email</span>
          <span className="text-right font-medium text-slate-900">
            {user?.email ?? "—"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Peran</span>
          <span className="text-right font-medium text-slate-900">
            {profil?.role === "admin" ? "Admin" : "Guru"}
          </span>
        </div>
      </div>

      <GantiPasswordForm email={user?.email ?? ""} />
    </div>
  );
}

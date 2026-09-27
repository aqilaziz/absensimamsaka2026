import { LoginForm } from "./login-form";
import { IdentitasFooter } from "@/components/identitas-footer";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Absensi Santri
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Masuk dengan akun guru Anda
        </p>
        <LoginForm />
      </div>
      <IdentitasFooter />
    </div>
  );
}

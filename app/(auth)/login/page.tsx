import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-2xl font-bold text-slate-900">Absensi Santri</h1>
      <p className="mt-1 text-sm text-slate-500">
        Masuk dengan akun guru Anda
      </p>
      <LoginForm />
    </div>
  );
}

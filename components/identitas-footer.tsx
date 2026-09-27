/**
 * Identitas resmi MAM 1 Paciran — logo, alamat, tautan sosial, dan hak cipta.
 * Dipakai di halaman login dan di bawah konten dashboard.
 *
 * Catatan: memakai <img> biasa (bukan next/image) karena `images.unoptimized`
 * sudah aktif di next.config.ts, sehingga optimasi next/image tidak dipakai.
 */
const TAUTAN = [
  { label: "Website", href: "https://mam1paciran.sch.id/" },
  { label: "Instagram", href: "https://www.instagram.com/mam.satu" },
  {
    label: "Facebook",
    href: "https://www.facebook.com/MAM-1-Karangasem",
  },
  { label: "TikTok", href: "https://www.tiktok.com/@mamsa.official" },
] as const;

export function IdentitasFooter({
  variant = "terang",
}: {
  /** "terang" = latar putih (login), "gelap" = latar dashboard */
  variant?: "terang" | "gelap";
}) {
  const gelap = variant === "gelap";

  return (
    <footer
      className={`mt-10 border-t pt-6 text-center ${
        gelap
          ? "border-emerald-900/10 text-slate-500"
          : "border-slate-200 text-slate-500"
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logomam1.png"
          alt="Logo MAM 1 Paciran"
          width={64}
          height={64}
          className="h-16 w-16 rounded-full object-contain"
        />

        <div className="space-y-1">
          <p
            className={`text-sm font-semibold ${
              gelap ? "text-slate-700" : "text-slate-800"
            }`}
          >
            MAM 1 Paciran
          </p>
          <p className="text-xs sm:text-sm">
            Jl. Pondok, Paciran, Kab. Lamongan, Jawa Timur 62264
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs sm:text-sm">
          {TAUTAN.map((t, i) => (
            <span key={t.href} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">•</span>}
              <a
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-700 hover:underline"
              >
                {t.label}
              </a>
            </span>
          ))}
        </nav>

        <p className="text-xs">© 2026 MAM 1 Paciran. All rights reserved.</p>
      </div>
    </footer>
  );
}

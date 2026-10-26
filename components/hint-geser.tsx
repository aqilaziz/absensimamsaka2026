/**
 * Petunjuk kecil untuk tabel lebar di layar HP: tabel memang bisa digeser
 * ke samping, tapi tanpa petunjuk pengguna sering tidak menyadarinya.
 */
export function HintGeser({ teks = "Geser tabel ke samping untuk kolom lainnya" }: { teks?: string }) {
  return (
    <p className="text-[11px] text-slate-400 sm:hidden">{teks} →</p>
  );
}

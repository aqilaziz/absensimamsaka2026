import Link from "next/link";

export function NamaSantriLink({
  id,
  nama,
  className,
}: {
  id: string;
  nama: string;
  className?: string;
}) {
  return (
    <Link
      href={`/santri/${id}`}
      className={
        className ??
        "font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 transition hover:text-emerald-700 hover:decoration-emerald-500"
      }
    >
      {nama}
    </Link>
  );
}

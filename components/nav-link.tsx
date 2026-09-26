"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
  exact = false,
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`block shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
        active
          ? "bg-emerald-800 font-semibold text-white"
          : "text-emerald-100/80 hover:bg-emerald-800/60 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

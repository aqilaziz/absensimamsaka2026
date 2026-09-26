"use client";

import { useEffect } from "react";

/**
 * Daftarkan service worker saat produksi saja.
 * Di mode dev service worker dimatikan agar tidak mengganggu hot reload.
 */
export function DaftarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const daftar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* diabaikan: PWA hanya nilai tambah, aplikasi tetap jalan */
      });
    };

    if (document.readyState === "complete") daftar();
    else {
      window.addEventListener("load", daftar, { once: true });
      return () => window.removeEventListener("load", daftar);
    }
  }, []);

  return null;
}

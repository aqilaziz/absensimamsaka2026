"use client";

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
  didOpen: (el) => {
    el.addEventListener("mouseenter", Swal.stopTimer);
    el.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

export function toastSukses(pesan: string) {
  toast.fire({ icon: "success", title: pesan });
}

export function toastGagal(pesan: string) {
  toast.fire({ icon: "error", title: pesan });
}

export async function konfirmasiHapus(opts: {
  judul?: string;
  teks: string;
  tombol?: string;
}): Promise<boolean> {
  const hasil = await Swal.fire({
    title: opts.judul ?? "Yakin ingin menghapus?",
    text: opts.teks,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#64748b",
    confirmButtonText: opts.tombol ?? "Ya, hapus",
    cancelButtonText: "Batal",
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      popup: "rounded-2xl",
      confirmButton: "rounded-lg",
      cancelButton: "rounded-lg",
    },
  });
  return hasil.isConfirmed;
}

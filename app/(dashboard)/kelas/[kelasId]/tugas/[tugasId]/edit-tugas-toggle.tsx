"use client";

import { useState } from "react";
import { TugasForm } from "../tugas-form";
import type { Tugas } from "@/lib/types";

export function EditTugasToggle({
  kelasId,
  tugas,
}: {
  kelasId: string;
  tugas: Tugas;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        Edit Tugas
      </button>
    );
  }

  return (
    <div className="max-w-2xl">
      <TugasForm kelasId={kelasId} tugas={tugas} onClose={() => setOpen(false)} />
    </div>
  );
}

import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/** Rute diagnosis sementara: mengukur latensi server → Supabase. */
export const dynamic = "force-dynamic";

export async function GET() {
  const { url, key } = getSupabaseEnv();
  const hasil: Record<string, unknown> = {};

  async function waktu(label: string, fn: () => Promise<Response>) {
    const t0 = performance.now();
    try {
      const res = await fn();
      await res.text();
      hasil[label] = { ms: Math.round(performance.now() - t0), status: res.status };
    } catch (e) {
      hasil[label] = { error: String(e) };
    }
  }

  await waktu("rest_root", () =>
    fetch(`${url}/rest/v1/`, { headers: { apikey: key }, cache: "no-store" }),
  );
  await waktu("select_kelas", () =>
    fetch(`${url}/rest/v1/kelas?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    }),
  );
  await waktu("select_kelas_2", () =>
    fetch(`${url}/rest/v1/kelas?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    }),
  );
  await waktu("rpc_rekap", () =>
    fetch(`${url}/rest/v1/rpc/rekap_absensi`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_kelas_id: "9068d8d2-114e-4fbc-a519-be10b8f9ce6e",
        p_dari: "2026-10-01",
        p_sampai: "2026-10-31",
      }),
      cache: "no-store",
    }),
  );
  await waktu("auth_user", () =>
    fetch(`${url}/auth/v1/.well-known/jwks.json`, {
      headers: { apikey: key },
      cache: "no-store",
    }),
  );

  return NextResponse.json({ region: process.env.VERCEL_REGION ?? "?", hasil });
}

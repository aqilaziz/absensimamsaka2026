import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/**
 * Request yang dilewati lebih cepat.
 *
 * Next.js menembakkan request saat tautan di-hover/di-prefetch. Memanggil
 * `auth.getUser()` (round-trip jaringan ke Supabase) untuk setiap prefetch
 * membuat navigasi terasa lambat, padahal halaman tujuan akan tetap
 * divalidasi sesinya ketika benar-benar dibuka. Jadi prefetch cukup
 * dilewatkan tanpa pengecekan sesi.
 */
function adalahPrefetch(request: NextRequest) {
  const h = request.headers;
  return (
    h.get("next-router-prefetch") === "1" ||
    h.get("purpose") === "prefetch" ||
    h.get("x-purpose") === "prefetch"
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Prefetch: lewati pemeriksaan sesi (tidak ada cookie yang perlu disegarkan
  // pada request prefetch, dan hasilnya tidak dipakai untuk redirect).
  if (adalahPrefetch(request)) {
    return { response, user: null };
  }

  let supabaseUrl: string;
  let supabaseKey: string;
  try {
    ({ url: supabaseUrl, key: supabaseKey } = getSupabaseEnv());
  } catch {
    // Env belum diisi (mis. di Vercel): jangan crash middleware (500),
    // biarkan request lewat; halaman akan menampilkan pesan yang jelas.
    // Pengecualian: halaman non-login tetap diarahkan ke /login.
    const { pathname } = request.nextUrl;
    if (
      !request.nextUrl.pathname.startsWith("/login") &&
      pathname !== "/login" &&
      !pathname.startsWith("/auth/")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return { response: NextResponse.redirect(url), user: null };
    }
    return { response, user: null };
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/login";
  const isAuthCallback = pathname.startsWith("/auth/");

  if (!user && !isLogin && !isAuthCallback) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return { response: NextResponse.redirect(url), user };
  }

  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return { response: NextResponse.redirect(url), user };
  }

  return { response, user };
}

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response } = await updateSession(request);
  return response;
}

export const config = {
  matcher: [
    /*
     * Lewati middleware untuk:
     * - aset internal Next.js (`_next/static`, `_next/image`)
     * - berkas PWA (`manifest.webmanifest`, `sw.js`, `offline`)
     * - berkas statis (favicon, gambar, video, font, txt, xml)
     * - route API (`/api/*`) — endpoint memvalidasi sendiri lewat cookie
     *   sesi + RLS, sehingga tidak perlu round-trip `auth.getUser()` lagi.
     */
    "/((?!api|_next/static|_next/image|manifest.webmanifest|sw.js|offline|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|txt|xml|woff2?)$).*)",
  ],
};

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip static assets and the PWA files, run on everything else (including /api/*).
    '/((?!_next/static|_next/image|favicon.ico|manifest-advisory.webmanifest|sw.js|icons/|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

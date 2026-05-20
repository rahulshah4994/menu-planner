import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Skip static files and the public viewer route (cook URL handles its own auth).
    "/((?!_next/static|_next/image|favicon.ico|viewer|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

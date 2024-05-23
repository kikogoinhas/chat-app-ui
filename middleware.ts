import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { startAuthFlow } from "@/app/lib/auth";
import { CookieId } from "./app/lib/session/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = cookies().get(CookieId.SESSION_ID);
  if (sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/auth";
    url.searchParams.set("redirect_uri", request.url);

    const authResponse = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ session: sessionCookie.value }),
    });

    const { success, error } = await authResponse.json();

    if (!success) {
      console.error(error);
      return startAuthFlow(request.nextUrl.clone().toString());
    }

    return NextResponse.next();
  }

  return startAuthFlow(request.url);
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/conversations", "/conversations/:path*"],
};

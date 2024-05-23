import { getAuthorizationToken } from "@/app/lib/auth";
import { CookieId } from "@/app/lib/session/cookies";
import { getOAuthSessionHandler } from "@/app/lib/session/oauth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const sessionHandler = await getOAuthSessionHandler();
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    const response = new Response("Missing code query param", {
      status: 400,
      statusText: "Bad request",
    });

    return response;
  }

  const stateBase64 = request.nextUrl.searchParams.get("state");

  if (!stateBase64) {
    const response = new Response("Missing state query param", {
      status: 400,
      statusText: "Bad request",
    });

    return response;
  }

  const redirectUri = atob(stateBase64);

  const authorizationResponse = await getAuthorizationToken(code);
  if (!authorizationResponse.success) {
    console.error(authorizationResponse);

    const response = new Response("Auth response failed", {
      status: 400,
      statusText: "Bad request",
    });

    return response;
  }

  const sessionId = await sessionHandler.createSession(
    authorizationResponse.body,
  );

  const response = NextResponse.redirect(redirectUri);

  response.cookies.set(CookieId.SESSION_ID, sessionId.id, {
    httpOnly: true,
    secure: true,
  });

  return response;
}

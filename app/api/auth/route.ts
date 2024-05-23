import { CookieId } from "@/app/lib/session/cookies";
import { getOAuthSessionHandler } from "@/app/lib/session/oauth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<Response> {
  const sessionHandler = await getOAuthSessionHandler();
  const { session: id } = await request.json();

  if (!id) {
    const body = {
      success: false,
      error: "session_id_param_required",
    };

    return new NextResponse(JSON.stringify(body), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const session = await sessionHandler.getSession(id);
  if (!session) {
    const body = {
      success: false,
      error: "session_not_found",
    };

    return new NextResponse(JSON.stringify(body), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const result = await sessionHandler.validateSession(session);

  if (!result.isValid) {
    const body = {
      success: false,
      error: "session_not_valid",
    };

    return new NextResponse(JSON.stringify(body), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return new NextResponse(JSON.stringify({ success: true }));
}

export async function GET(request: NextRequest): Promise<Response> {
  const sessionHandler = await getOAuthSessionHandler();
  const sidCookie = request.cookies.get(CookieId.SESSION_ID);
  const UnauthorizedResponse = () =>
    new NextResponse(
      JSON.stringify({
        success: false,
        error: "Unauthorized",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

  if (!sidCookie) {
    return UnauthorizedResponse();
  }

  const session = await sessionHandler.getSession(sidCookie.value);

  if (!session) {
    console.error(new Error(`Session with id ${sidCookie.value} not found`));
    return UnauthorizedResponse();
  }

  const result = await sessionHandler.validateSession(session);

  if (!result.isValid) {
    const body = {
      success: false,
      error: "session_not_valid",
    };

    return new NextResponse(JSON.stringify(body), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return new NextResponse(
    JSON.stringify({
      access_token: result.payload.value.access_token,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

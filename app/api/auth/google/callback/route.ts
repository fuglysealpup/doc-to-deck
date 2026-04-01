import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    const baseUrl = request.nextUrl.origin;
    return NextResponse.redirect(
      `${baseUrl}/?google_auth=error&reason=${error || "no_code"}`
    );
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const baseUrl = request.nextUrl.origin;
    return NextResponse.redirect(
      `${baseUrl}/?google_auth=error&reason=token_exchange_failed`
    );
  }

  const tokens = await tokenRes.json();
  const baseUrl = request.nextUrl.origin;
  const response = NextResponse.redirect(`${baseUrl}/?google_auth=success`);

  response.cookies.set("google_access_token", tokens.access_token, {
    httpOnly: true,
    path: "/",
    maxAge: 3500,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

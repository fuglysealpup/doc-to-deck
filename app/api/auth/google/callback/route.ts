import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    return new NextResponse(
      closePopupHtml("error", error || "no_code"),
      { status: 200, headers: { "Content-Type": "text/html" } }
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
    return new NextResponse(
      closePopupHtml("error", "token_exchange_failed"),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }

  const tokens = await tokenRes.json();

  const response = new NextResponse(
    closePopupHtml("success"),
    { status: 200, headers: { "Content-Type": "text/html" } }
  );

  response.cookies.set("google_access_token", tokens.access_token, {
    httpOnly: true,
    path: "/",
    maxAge: 3500,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

function closePopupHtml(status: string, reason?: string): string {
  const message = JSON.stringify({ type: "google_auth", status, reason });
  return `<!DOCTYPE html>
<html><head><title>Signing in...</title></head>
<body>
<p style="font-family:system-ui;text-align:center;margin-top:40vh;color:#999">
  Signing in... this window will close automatically.
</p>
<script>
  if (window.opener) {
    window.opener.postMessage(${JSON.stringify(message)}, window.location.origin);
  }
  window.close();
</script>
</body></html>`;
}

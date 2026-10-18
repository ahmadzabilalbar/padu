import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection, type NextRequest } from "next/server";
import { callbackUrl, createAuthRequest, googleConfig, OAUTH_COOKIE } from "@/lib/google";

/** Start "Sign in with Google": remember state + PKCE verifier, then go to Google. */
export async function GET(request: NextRequest) {
  await connection(); // always per request: never prerender sign-in

  const cfg = googleConfig();
  if (!cfg) redirect("/admin?error=google-not-configured");

  const { url, cookie } = createAuthRequest(cfg.clientId, callbackUrl(request.url), cfg.adminEmail);
  (await cookies()).set(OAUTH_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth/google",
    maxAge: 600,
  });
  redirect(url.toString());
}

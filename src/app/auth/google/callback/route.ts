import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection, type NextRequest } from "next/server";
import { startAdminSession } from "@/lib/auth";
import { callbackUrl, googleConfig, OAUTH_COOKIE, verifiedEmail } from "@/lib/google";

/** Google sends the admin back here. Only ADMIN_EMAIL gets an admin session. */
export async function GET(request: NextRequest) {
  await connection(); // always per request: never prerender sign-in

  const cfg = googleConfig();
  if (!cfg) redirect("/admin?error=google-not-configured");

  const params = request.nextUrl.searchParams;
  const store = await cookies();
  const saved = store.get(OAUTH_COOKIE)?.value ?? "";
  store.delete({ name: OAUTH_COOKIE, path: "/auth/google" });

  const [state, verifier] = saved.split(".");
  const code = params.get("code");
  const returned = params.get("state") ?? "";
  if (params.get("error") || !code || !state || !verifier || !sameString(state, returned)) {
    redirect("/admin?error=google-cancelled");
  }

  const email = await verifiedEmail(code, verifier, callbackUrl(request.url), cfg);
  if (email !== cfg.adminEmail) redirect("/admin?error=not-admin");

  await startAdminSession();
  redirect("/admin");
}

function sameString(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

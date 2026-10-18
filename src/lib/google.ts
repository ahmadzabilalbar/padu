import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * Minimal "Sign in with Google" (OpenID Connect, authorization code + PKCE).
 * Only used to prove the admin's identity; the session itself is our signed cookie.
 */

export const OAUTH_COOKIE = "padu_google_oauth";

export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!clientId || !clientSecret || !adminEmail) return null;
  return { clientId, clientSecret, adminEmail };
}

export function callbackUrl(requestUrl: string) {
  return new URL("/auth/google/callback", requestUrl).toString();
}

export function createAuthRequest(clientId: string, redirectUri: string, loginHint: string) {
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
    login_hint: loginHint,
  }).toString();

  return { url, cookie: `${state}.${verifier}` };
}

type IdToken = { iss: string; aud: string; exp: number; email?: string; email_verified?: boolean };

/**
 * Exchange the code for tokens and return the verified email.
 * The ID token comes straight from Google's token endpoint over TLS (server to
 * server, authenticated with our client secret), so per OIDC Core §3.1.3.7 its
 * claims can be trusted without checking the signature; we still check iss/aud/exp.
 */
export async function verifiedEmail(
  code: string,
  verifier: string,
  redirectUri: string,
  cfg: { clientId: string; clientSecret: string },
): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      code_verifier: verifier,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!res.ok) return null;

  const { id_token } = (await res.json()) as { id_token?: string };
  const payload = id_token?.split(".")[1];
  if (!payload) return null;
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as IdToken;

  const issuerOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  if (!issuerOk || claims.aud !== cfg.clientId || claims.exp * 1000 < Date.now()) return null;
  if (!claims.email || claims.email_verified !== true) return null;
  return claims.email.toLowerCase();
}

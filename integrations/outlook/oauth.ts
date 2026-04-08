import { randomUUID } from "node:crypto";
import type { MicrosoftTokenResponse } from "./types";

const MICROSOFT_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

const GRAPH_SCOPES = ["openid", "profile", "email", "offline_access", "Mail.Read", "Mail.ReadWrite", "Mail.Send"];

export function buildMicrosoftAuthUrl(state?: string): { url: string; state: string } {
  const resolvedState = state ?? randomUUID();
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
    response_type: "code",
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI ?? "",
    response_mode: "query",
    scope: GRAPH_SCOPES.join(" "),
    state: resolvedState
  });

  return { url: `${MICROSOFT_AUTH_URL}?${params.toString()}`, state: resolvedState };
}

export async function exchangeMicrosoftCodeForToken(code: string): Promise<MicrosoftTokenResponse> {
  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
    client_secret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI ?? ""
  });

  const response = await fetch(MICROSOFT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error(`Microsoft token exchange failed (${response.status})`);
  }

  return response.json() as Promise<MicrosoftTokenResponse>;
}

export async function refreshMicrosoftAccessToken(refreshToken: string): Promise<MicrosoftTokenResponse> {
  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
    client_secret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: GRAPH_SCOPES.join(" ")
  });

  const response = await fetch(MICROSOFT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error(`Microsoft token refresh failed (${response.status})`);
  }

  return response.json() as Promise<MicrosoftTokenResponse>;
}

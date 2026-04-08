import { decryptSecret, encryptSecret } from "@/utils/crypto";
import type { ProviderAccount } from "@/integrations/email/types";
import type { NormalizedEmail } from "@/types/email";
import { getMessage, listRecentMessageIds } from "./client";
import { normalizeGmailMessage } from "./normalize";
import { refreshGoogleAccessToken } from "./oauth";

export function encodeTokens(tokens: { accessToken: string; refreshToken?: string }) {
  return {
    accessToken: encryptSecret(tokens.accessToken),
    refreshToken: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : undefined
  };
}

async function resolveAccessToken(account: ProviderAccount): Promise<{ accessToken: string; rotated?: { accessToken: string } }> {
  let accessToken = decryptSecret(account.accessToken);

  try {
    await listRecentMessageIds(accessToken, 1);
    return { accessToken };
  } catch {
    if (!account.refreshToken) throw new Error("Refresh token missing for Gmail account");
    const refreshed = await refreshGoogleAccessToken(decryptSecret(account.refreshToken));
    accessToken = refreshed.access_token;
    return { accessToken, rotated: { accessToken: encryptSecret(accessToken) } };
  }
}

export async function fetchAndNormalizeRecentGmail(account: ProviderAccount): Promise<{
  emails: NormalizedEmail[];
  rotated?: { accessToken: string };
}> {
  const { accessToken, rotated } = await resolveAccessToken(account);
  const ids = await listRecentMessageIds(accessToken, 20);
  const details = await Promise.all(ids.map((id) => getMessage(accessToken, id)));
  return {
    emails: details.map((message) => normalizeGmailMessage(account, message)),
    rotated
  };
}

import { decryptSecret, encryptSecret } from "@/utils/crypto";
import type { ProviderAccount } from "@/integrations/email/types";
import type { NormalizedEmail } from "@/types/email";
import { listRecentMessages } from "./client";
import { normalizeOutlookMessage } from "./normalize";
import { refreshMicrosoftAccessToken } from "./oauth";

export function encodeMicrosoftTokens(tokens: { accessToken: string; refreshToken?: string }) {
  return {
    accessToken: encryptSecret(tokens.accessToken),
    refreshToken: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : undefined
  };
}

async function resolveAccessToken(account: ProviderAccount): Promise<{ accessToken: string; rotated?: { accessToken: string } }> {
  let accessToken = decryptSecret(account.accessToken);

  try {
    await listRecentMessages(accessToken, 1);
    return { accessToken };
  } catch {
    if (!account.refreshToken) throw new Error("Refresh token missing for Outlook account");
    const refreshed = await refreshMicrosoftAccessToken(decryptSecret(account.refreshToken));
    accessToken = refreshed.access_token;
    return { accessToken, rotated: { accessToken: encryptSecret(accessToken) } };
  }
}

export async function fetchAndNormalizeRecentOutlook(account: ProviderAccount): Promise<{
  emails: NormalizedEmail[];
  rotated?: { accessToken: string };
}> {
  const { accessToken, rotated } = await resolveAccessToken(account);
  const messages = await listRecentMessages(accessToken, 20);

  return {
    emails: messages.map((message) => normalizeOutlookMessage(account, message)),
    rotated
  };
}

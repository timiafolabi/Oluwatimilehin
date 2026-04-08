import { prisma } from "@/db/client";
import { buildMicrosoftAuthUrl, exchangeMicrosoftCodeForToken } from "@/integrations/outlook/oauth";
import { encodeMicrosoftTokens } from "@/integrations/outlook/service";

export async function startOutlookOAuth(userId: string): Promise<{ authUrl: string; state: string }> {
  const { url, state } = buildMicrosoftAuthUrl();

  await prisma.activityLog.create({
    data: {
      userId,
      action: "outlook_oauth_started",
      status: "ok",
      metadata: { state }
    }
  });

  return { authUrl: url, state };
}

export async function completeOutlookOAuth(params: {
  userId: string;
  accountEmail: string;
  code: string;
  state: string;
}) {
  // TODO: Validate state against secure store/session nonce.
  const tokenResponse = await exchangeMicrosoftCodeForToken(params.code);
  const secureTokens = encodeMicrosoftTokens({
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token
  });

  return prisma.connectedAccount.upsert({
    where: {
      userId_provider_accountEmail: {
        userId: params.userId,
        provider: "outlook",
        accountEmail: params.accountEmail
      }
    },
    update: {
      accessToken: secureTokens.accessToken,
      refreshToken: secureTokens.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
      status: "connected"
    },
    create: {
      userId: params.userId,
      provider: "outlook",
      accountEmail: params.accountEmail,
      accessToken: secureTokens.accessToken,
      refreshToken: secureTokens.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
      status: "connected"
    }
  });
}

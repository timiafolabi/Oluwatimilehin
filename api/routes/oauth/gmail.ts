import { prisma } from "@/db/client";
import { buildGoogleAuthUrl, exchangeGoogleCodeForToken } from "@/integrations/gmail/oauth";
import { encodeTokens } from "@/integrations/gmail/service";

export async function startGmailOAuth(userId: string): Promise<{ authUrl: string; state: string }> {
  const { url, state } = buildGoogleAuthUrl();

  await prisma.activityLog.create({
    data: {
      userId,
      action: "gmail_oauth_started",
      status: "ok",
      metadata: { state }
    }
  });

  return { authUrl: url, state };
}

export async function completeGmailOAuth(params: {
  userId: string;
  accountEmail: string;
  code: string;
  state: string;
}) {
  // TODO: Validate state against secure store/session nonce.
  const tokenResponse = await exchangeGoogleCodeForToken(params.code);
  const secureTokens = encodeTokens({
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token
  });

  return prisma.connectedAccount.upsert({
    where: {
      userId_provider_accountEmail: {
        userId: params.userId,
        provider: "gmail",
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
      provider: "gmail",
      accountEmail: params.accountEmail,
      accessToken: secureTokens.accessToken,
      refreshToken: secureTokens.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
      status: "connected"
    }
  });
}

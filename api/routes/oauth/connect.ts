import { prisma } from "@/db/client";
import type { EmailProvider } from "@/types/email";
import { encodeTokens } from "@/integrations/gmail/service";
import { encodeMicrosoftTokens } from "@/integrations/outlook/service";

export async function connectAccount(params: {
  userEmail: string;
  provider: EmailProvider;
  accountEmail: string;
  accessToken: string;
  refreshToken?: string;
}) {
  const user = await prisma.user.upsert({
    where: { email: params.userEmail },
    update: {},
    create: { email: params.userEmail }
  });

  const tokens =
    params.provider === "gmail"
      ? encodeTokens({ accessToken: params.accessToken, refreshToken: params.refreshToken })
      : params.provider === "outlook"
        ? encodeMicrosoftTokens({ accessToken: params.accessToken, refreshToken: params.refreshToken })
        : { accessToken: params.accessToken, refreshToken: params.refreshToken };

  // TODO: Exchange OAuth authorization code for provider tokens in callback routes.
  return prisma.connectedAccount.upsert({
    where: {
      userId_provider_accountEmail: {
        userId: user.id,
        provider: params.provider,
        accountEmail: params.accountEmail
      }
    },
    update: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      status: "connected"
    },
    create: {
      userId: user.id,
      provider: params.provider,
      accountEmail: params.accountEmail,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      status: "connected"
    }
  });
}

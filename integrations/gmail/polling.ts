import { prisma } from "@/db/client";
import { ingestAllAccounts } from "@/api/routes/emails/ingest";

export async function pollGmailAccountsForUser(userId: string) {
  const accounts = await prisma.connectedAccount.findMany({
    where: { userId, provider: "gmail", status: "connected" },
    select: { id: true }
  });

  if (!accounts.length) return { queued: 0 };

  await ingestAllAccounts(userId);
  return { queued: accounts.length };
}

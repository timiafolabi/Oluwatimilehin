import { prisma } from "@/db/client";
import { pollGmailAccountsForUser } from "@/integrations/gmail/polling";
import { pollOutlookAccountsForUser } from "@/integrations/outlook/polling";

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });

  for (const user of users) {
    await pollGmailAccountsForUser(user.id);
    await pollOutlookAccountsForUser(user.id);
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

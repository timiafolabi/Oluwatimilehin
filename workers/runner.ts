import { enqueueJob, processQueue } from "./queue";
import { ingestAllAccounts } from "@/api/routes/emails/ingest";
import { prisma } from "@/db/client";

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });

  for (const user of users) {
    enqueueJob({
      id: `ingest-${user.id}`,
      maxAttempts: 3,
      payload: { userId: user.id },
      run: async ({ userId }: { userId: string }) => {
        await ingestAllAccounts(userId);
      }
    });
  }

  await processQueue();
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

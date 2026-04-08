import { prisma } from "@/db/client";

export async function updateNotificationPreference(accountId: string, notificationsOn: boolean) {
  return prisma.connectedAccount.update({
    where: { id: accountId },
    data: { notificationsOn }
  });
}

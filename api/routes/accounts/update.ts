import { prisma } from "@/db/client";

export async function updateAccountControls(params: {
  accountId: string;
  notificationsOn?: boolean;
  draftingEnabled?: boolean;
  autoActionsEnabled?: boolean;
}) {
  return prisma.connectedAccount.update({
    where: { id: params.accountId },
    data: {
      notificationsOn: params.notificationsOn,
      draftingEnabled: params.draftingEnabled,
      autoActionsEnabled: params.autoActionsEnabled
    }
  });
}

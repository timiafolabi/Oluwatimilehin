import type { EmailProviderAdapter, ProviderAccount } from "./types";
import type { NormalizedEmail } from "@/types/email";
import { makeMockEmail } from "@/utils/mockData";
import { fetchAndNormalizeRecentOutlook } from "@/integrations/outlook/service";
import { prisma } from "@/db/client";

export class OutlookAdapter implements EmailProviderAdapter {
  provider: "outlook" = "outlook";

  async fetchRecentEmails(account: ProviderAccount): Promise<NormalizedEmail[]> {
    if (process.env.MOCK_MODE === "true" || !process.env.MICROSOFT_CLIENT_ID) {
      return [makeMockEmail(account, "outlook-001", "Quarterly planning invite")];
    }

    const result = await fetchAndNormalizeRecentOutlook(account);

    if (result.rotated) {
      await prisma.connectedAccount.update({
        where: { id: account.id },
        data: { accessToken: result.rotated.accessToken }
      });
    }

    return result.emails;
  }

  async archiveEmail(_account: ProviderAccount, _emailId: string): Promise<void> {
    // TODO: Implement Graph archive/move operation.
  }

  async sendReply(_account: ProviderAccount, _threadId: string, _body: string): Promise<void> {
    // TODO: Implement Graph reply endpoint.
  }
}

import type { EmailProviderAdapter, ProviderAccount } from "./types";
import type { NormalizedEmail } from "@/types/email";
import { makeMockEmail } from "@/utils/mockData";
import { fetchAndNormalizeRecentGmail } from "@/integrations/gmail/service";
import { prisma } from "@/db/client";

export class GmailAdapter implements EmailProviderAdapter {
  provider: "gmail" = "gmail";

  async fetchRecentEmails(account: ProviderAccount): Promise<NormalizedEmail[]> {
    if (process.env.MOCK_MODE === "true" || !process.env.GOOGLE_CLIENT_ID) {
      return [makeMockEmail(account, "gmail-001", "Please review invoice before Friday")];
    }

    const result = await fetchAndNormalizeRecentGmail(account);

    if (result.rotated) {
      await prisma.connectedAccount.update({
        where: { id: account.id },
        data: { accessToken: result.rotated.accessToken }
      });
    }

    return result.emails;
  }

  async archiveEmail(_account: ProviderAccount, _emailId: string): Promise<void> {
    // TODO: Implement Gmail modify labels call.
  }

  async sendReply(_account: ProviderAccount, _threadId: string, _body: string): Promise<void> {
    // TODO: Implement Gmail thread reply send call.
  }
}

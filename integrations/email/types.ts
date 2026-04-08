import type { EmailProvider, NormalizedEmail } from "@/types/email";

export interface ProviderAccount {
  id: string;
  userId: string;
  provider: EmailProvider;
  accountEmail: string;
  accessToken: string;
  refreshToken?: string | null;
}

export interface EmailProviderAdapter {
  provider: EmailProvider;
  fetchRecentEmails(account: ProviderAccount): Promise<NormalizedEmail[]>;
  archiveEmail(account: ProviderAccount, emailId: string): Promise<void>;
  sendReply(account: ProviderAccount, threadId: string, body: string): Promise<void>;
}

import { emailProviders } from "@/integrations/email";
import type { ProviderAccount } from "@/integrations/email/types";
import { runTriage } from "./triage";
import { applyPersonalizationScore } from "./personalization";
import { toAppError } from "@/utils/errors";

export async function ingestForAccount(account: ProviderAccount) {
  try {
    const adapter = emailProviders[account.provider];
    if (!adapter) throw new Error(`No provider adapter for ${account.provider}`);

    const messages = await adapter.fetchRecentEmails(account);
    const triaged = await Promise.all(messages.map((email) => runTriage(email)));
    return Promise.all(triaged.map((email) => applyPersonalizationScore(account.userId, email)));
  } catch (error) {
    throw toAppError(error, "INGEST_ACCOUNT_FAILED", { accountId: account.id, provider: account.provider });
  }
}

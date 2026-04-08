import { GmailAdapter } from "./gmail";
import { OutlookAdapter } from "./outlook";
import type { EmailProviderAdapter } from "./types";

export const emailProviders: Record<string, EmailProviderAdapter> = {
  gmail: new GmailAdapter(),
  outlook: new OutlookAdapter()
};

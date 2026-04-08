import type { SmsProvider, SmsMessage, SmsSendResult } from "./types";

export class MockSmsProvider implements SmsProvider {
  async send(message: SmsMessage): Promise<SmsSendResult> {
    console.log("[Mock SMS]", message.to, message.body);
    return { providerMessageId: `mock-${Date.now()}`, provider: "mock" };
  }
}

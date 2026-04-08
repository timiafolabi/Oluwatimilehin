export interface SmsMessage {
  to: string;
  body: string;
  from?: string;
}

export interface SmsSendResult {
  providerMessageId: string;
  provider: "mock" | "twilio";
}

export interface SmsProvider {
  send(message: SmsMessage): Promise<SmsSendResult>;
}

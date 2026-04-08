import { MockSmsProvider } from "./mock";
import type { SmsProvider, SmsMessage, SmsSendResult } from "./types";

class TwilioSmsProvider implements SmsProvider {
  async send(message: SmsMessage): Promise<SmsSendResult> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER ?? message.from;

    if (!sid || !token || !from) {
      throw new Error("Missing Twilio credentials or from number");
    }

    const body = new URLSearchParams({
      To: message.to,
      From: from,
      Body: message.body
    });

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body.toString()
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Twilio SMS failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as { sid: string };
    return { providerMessageId: data.sid, provider: "twilio" };
  }
}

export const smsProvider: SmsProvider =
  process.env.MOCK_MODE === "true" || !process.env.TWILIO_ACCOUNT_SID ? new MockSmsProvider() : new TwilioSmsProvider();

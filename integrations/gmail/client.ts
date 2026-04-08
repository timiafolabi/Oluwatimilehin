import type { GmailMessage } from "./types";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

async function gmailFetch<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gmail API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

export async function listRecentMessageIds(accessToken: string, maxResults = 20): Promise<string[]> {
  const result = await gmailFetch<{ messages?: Array<{ id: string }> }>(
    accessToken,
    `/messages?maxResults=${maxResults}&q=-category:social -category:forums`
  );
  return (result.messages ?? []).map((message) => message.id);
}

export async function getMessage(accessToken: string, messageId: string): Promise<GmailMessage> {
  return gmailFetch<GmailMessage>(accessToken, `/messages/${messageId}?format=full`);
}

import type { GraphMessage } from "./types";

const GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";

async function graphFetch<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(`${GRAPH_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.body-content-type="text"'
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Graph API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

export async function listRecentMessages(accessToken: string, top = 20): Promise<GraphMessage[]> {
  const query = new URLSearchParams({
    $top: String(top),
    $orderby: "receivedDateTime desc",
    $select:
      "id,conversationId,internetMessageId,receivedDateTime,subject,body,uniqueBody,from,toRecipients,ccRecipients,categories,importance,hasAttachments,webLink",
    $expand: "attachments($select=id,name,contentType,size,isInline)"
  });

  const data = await graphFetch<{ value: GraphMessage[] }>(accessToken, `/me/messages?${query.toString()}`);
  return data.value ?? [];
}

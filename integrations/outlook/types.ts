export interface MicrosoftTokenResponse {
  token_type: "Bearer";
  scope: string;
  expires_in: number;
  access_token: string;
  refresh_token?: string;
}

export interface GraphEmailAddress {
  name?: string;
  address?: string;
}

export interface GraphRecipient {
  emailAddress?: GraphEmailAddress;
}

export interface GraphItemBody {
  contentType?: "text" | "html";
  content?: string;
}

export interface GraphAttachment {
  id?: string;
  name?: string;
  contentType?: string;
  size?: number;
  isInline?: boolean;
}

export interface GraphMessage {
  id: string;
  conversationId?: string;
  internetMessageId?: string;
  receivedDateTime?: string;
  subject?: string;
  body?: GraphItemBody;
  uniqueBody?: GraphItemBody;
  from?: GraphRecipient;
  toRecipients?: GraphRecipient[];
  ccRecipients?: GraphRecipient[];
  categories?: string[];
  importance?: "low" | "normal" | "high";
  hasAttachments?: boolean;
  attachments?: GraphAttachment[];
  webLink?: string;
}

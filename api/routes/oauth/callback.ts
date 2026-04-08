import { connectAccount } from "./connect";

export async function handleOAuthCallback(params: {
  provider: "gmail" | "outlook";
  userEmail: string;
  accountEmail: string;
  accessToken: string;
  refreshToken?: string;
}) {
  // TODO: Validate OAuth state + nonce and exchange auth code for tokens.
  return connectAccount(params);
}

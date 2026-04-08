import { cookies } from "next/headers";
import crypto from "node:crypto";

const SESSION_COOKIE = "email_assistant_session";

export function createSessionToken(userId: string): string {
  const payload = `${userId}:${Date.now()}`;
  const secret = process.env.SESSION_SECRET ?? "dev-secret";
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export async function setSession(userId: string): Promise<void> {
  const token = createSessionToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
}

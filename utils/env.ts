import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  MOCK_MODE: z.enum(["true", "false"]).default("true"),
  AI_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.75),
  SESSION_SECRET: z.string().optional(),
  TOKEN_ENCRYPTION_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  OPENAI_API_KEY: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Environment validation failed: ${issues}`);
}

const data = parsed.data;
const isProd = data.NODE_ENV === "production";

if (isProd && !data.DATABASE_URL) {
  throw new Error("DATABASE_URL is required in production");
}

if (isProd && !data.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required in production");
}

if (data.MOCK_MODE === "false" && !data.TOKEN_ENCRYPTION_KEY) {
  throw new Error("TOKEN_ENCRYPTION_KEY is required when MOCK_MODE=false");
}

export const env = {
  nodeEnv: data.NODE_ENV,
  mockMode: data.MOCK_MODE === "true",
  appUrl: data.APP_URL,
  confidenceThreshold: data.AI_CONFIDENCE_THRESHOLD,
  databaseUrl: data.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/email_assistant",
  sessionSecret: data.SESSION_SECRET ?? "dev-session-secret"
};

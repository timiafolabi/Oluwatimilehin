# Oluwatimilehin Assistant MVP

Production-style MVP built with Next.js + TypeScript, Prisma/Postgres, queue-based workers, provider abstractions, and mocked integrations for local development.

## Features
- Multi-account OAuth connection scaffold for Gmail + Outlook
- Unified normalized email model across providers
- AI triage pipeline (classification, extraction, risk, drafting)
- SMS alerting + inbound command handling (mock/Twilio-ready)
- Guardrails for risky categories and approval workflow
- Dashboard with inbox, filters, draft approvals, rules, and activity log
- Lightweight learning signals for personalization
- Background jobs with retries + structured logging

## Project structure
- `app/frontend` – Next.js App Router pages/components
- `api/routes` – Route handlers for integrations and workflows
- `services` – Business logic (triage, rules, learning, commands)
- `integrations` – Provider adapters (Gmail, Outlook, SMS, AI)
- `integrations/gmail` – Gmail OAuth, API client, normalization, polling helpers
- `integrations/outlook` – Microsoft OAuth, Graph client, normalization, polling helpers
- `workers` – Queue jobs and processors
- `db` – Prisma schema + seed
- `prompts` – Prompt templates
- `utils` – Shared helpers

## Quick start
> This project uses `tsx` for tests/workers. It is installed via `npm install` (dev dependency).
1. Install deps
   ```bash
   npm install
   ```
2. Configure environment
   ```bash
   cp .env.example .env
   ```
3. Start Postgres and update `DATABASE_URL`.
4. Run Prisma migrations + seed:
   ```bash
   npm run db:push
   npm run db:seed
   ```
5. Start dev server:
   ```bash
   npm run dev
   ```
6. Run worker in separate terminal:
   ```bash
   npm run worker
   ```
7. Optional provider poll worker:
   ```bash
   npm run worker:poll
   ```

Recommended fresh-worktree verification:
```bash
npm install
npm run build
npm test
```

## Gmail OAuth setup (Google Cloud)
1. Create or select a Google Cloud project.
2. Enable **Gmail API**.
3. Configure OAuth consent screen (External/Internal, test users, app name).
4. Create OAuth client credentials (Web application).
5. Add authorized redirect URI matching `GOOGLE_REDIRECT_URI`.
6. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
7. Set `TOKEN_ENCRYPTION_KEY` to a base64 encoded 32-byte key.

Required Gmail scopes:
- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.send`

## Outlook/Microsoft 365 OAuth setup (Azure)
1. Open **Microsoft Entra ID** → **App registrations** → **New registration**.
2. Configure Redirect URI (Web) to match `MICROSOFT_REDIRECT_URI`.
3. Create a client secret under **Certificates & secrets**.
4. Under **API permissions**, add Microsoft Graph delegated permissions below.
5. Grant admin consent where required by tenant policy.
6. Set `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI` in `.env`.

Required Graph delegated permissions:
- `openid`
- `profile`
- `email`
- `offline_access`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`


## AI triage pipeline
- Prompt templates live in `prompts/triage-system.md` and `prompts/triage-user.md`.
- Triage classification labels: urgent, important, normal, low_priority, spam_promotional.
- Extracted outputs persisted: summary, action items, deadline, suggested response (draft), risk level, risk categories, confidence.
- Confidence below `AI_CONFIDENCE_THRESHOLD` is routed to manual review (`needs_approval`).
- Policy rules force approval for legal, financial, medical, school, recruiting, security, and sensitive personal topics.
- Provider swapping is supported via the `AIProvider` interface.

## Provider integration behavior
- If `MOCK_MODE=true` or provider credentials are missing, adapters return deterministic mock messages.
- If credentials are present:
  - Gmail adapter fetches recent messages and normalizes sender/subject/bodies/labels/thread/attachments/timestamp.
  - Outlook adapter fetches recent Graph messages and normalizes sender/subject/bodies/categories/attachments/timestamp.
- OAuth tokens are encrypted before DB storage.
- Access token refresh is supported for Gmail and Outlook.
- Polling helpers (`integrations/gmail/polling.ts`, `integrations/outlook/polling.ts`) are scheduler-ready.

## OAuth + provider TODOs
Credential-dependent pieces include TODO comments in:
- `integrations/email/gmail.ts`
- `integrations/email/outlook.ts`
- `api/routes/oauth/*`
- `integrations/sms/twilio.ts`
- `integrations/ai/openai.ts`




## Lightweight personalization (transparent)
- Signals tracked: alert clicked/ignored, draft approved/edited/rejected, and importance overrides.
- Preferences tracked: important senders, muted senders, and categories that should trigger instant SMS.
- Scoring is rule-assisted and inspectable (no opaque black-box):
  - +0.35 for important sender
  - -0.60 for muted sender
  - +0.20 for instant SMS category match
  - +/-0.10 from recent interaction signals
- Score influences ranking and can up-rank/down-rank message class with explicit reason tags stored in `aiActionItems`.
- Settings are editable via personalization routes and visible in dashboard settings panel.

## Drafting, approval, and guarded sending
- Draft lifecycle service lives in `services/drafts.ts` and policy checks in `services/sendPolicy.ts`.
- AI-generated drafts can be created, edited, approved-and-sent, or rejected.
- Guardrails:
  - high-risk emails are never auto-sent
  - medium/high risk requires explicit approval before send
  - category-sensitive messages follow user approval categories
- Every draft creation/edit/reject/send writes ActivityLog entries.
- Draft revisions are stored in `DraftRevision`, and sent messages are stored in `SentMessage`.

## SMS notifications and commands
- SMS provider abstraction is defined in `integrations/sms/types.ts` and implemented by Twilio-compatible transport (`integrations/sms/twilio.ts`) with mock fallback.
- Urgent/important triaged messages trigger concise SMS alerts with subject + short summary.
- Inbound commands supported:
  - `summarize`
  - `archive`
  - `draft reply saying ...`
  - `reply and send ...`
  - `mark sender important`
  - `ignore messages like this`
- Ambiguous commands are converted into draft creation and confirmation prompts instead of immediate send.
- All inbound and outbound SMS actions are logged in `SmsEvent` and `ActivityLog`.

## Safety guardrails
- Never auto-send high-risk emails
- Approval required for legal/financial/medical/academic/recruiting/security/sensitive categories
- Ambiguous inbound SMS commands create draft instead of send
- Confidence thresholds prevent aggressive actions
- All outbound actions are logged



## Local mocked development checklist
- Set `MOCK_MODE=true` (default) to run without live provider credentials.
- Keep OAuth/Twilio/AI keys empty in local mocked mode.
- Run `npm run db:push`, `npm run db:seed`, `npm run dev`, and `npm run worker`.
- Use `npm run check:env` to validate environment shape before startup.

## Deployment (Vercel + worker service)
1. Push repo to Git provider and import into Vercel.
2. Set all environment variables from `.env.example` in Vercel project settings.
3. Provision managed Postgres (Neon/Supabase/RDS) and set `DATABASE_URL`.
4. Run schema deployment during build/release (`prisma db push` or migrations).
5. Set `MOCK_MODE=false` in production once OAuth/Twilio/AI credentials are live.
6. Configure OAuth redirect URIs to your production domain.
7. Deploy worker/background service separately (Render/Fly/Railway/Cron) running:
   - `npm run worker`
   - `npm run worker:poll`
8. Add health checks/log drains for worker process and monitor failed jobs.

### Recommended Vercel setup
- Framework preset: Next.js
- Build command: `npm run build`
- Output: default Next.js output
- Optional post-deploy hook: run `npm run db:seed` only in non-production demo environments

## Demo accounts
Run `npm run db:seed` to create demo user, accounts, inbox records, rules, and logs for UI smoke testing.



## Local setup (including Codex worktrees)
1. Clone repository and enter the repo/worktree directory.
2. Run dependency install:
   ```bash
   npm install
   ```
3. Copy environment template and edit required values:
   ```bash
   cp .env.example .env
   ```
4. Validate environment configuration:
   ```bash
   npm run check:env
   ```
5. Initialize database and seed:
   ```bash
   npm run db:push
   npm run db:seed
   ```
6. Start app + workers:
   ```bash
   npm run dev
   npm run worker
   npm run worker:poll
   ```

For Codex worktrees, run the same steps inside each worktree root (each worktree has its own `.env` and install context).

## Testing
- `npm test` runs unit tests (`pretest` runs typecheck first).
- `npm run test:full` runs env check + typecheck + tests.

## Common setup failures
- `tsx: not found`: run `npm install` first (dev dependencies are required).
- `Environment validation failed`: ensure `.env` is present and required values are set.
- `TOKEN_ENCRYPTION_KEY is required when MOCK_MODE=false`: either set the key or keep `MOCK_MODE=true` for local mocked development.
- OAuth callback failures: verify redirect URIs exactly match provider console settings.
- Worker not processing jobs: run `npm run worker` and `npm run worker:poll` in separate processes.


## Why Codex kept showing dependency errors
Codex worktrees are often created without `node_modules`, so TypeScript cannot resolve packages like `react`, `next`, `node` typings, or `tsx` until dependencies are installed.

What was fixed:
- explicit typings in `devDependencies` (`@types/node`, `@types/react`, `@types/react-dom`)
- explicit TS type libraries in `tsconfig.json`
- `setup:local` script now bootstraps install/build/test in one command
- environment validation now allows safe development defaults and only enforces strict values in production

If you still see errors:
1. Run `npm install` first.
2. Run `npm run check:env` to confirm env shape.
3. Run `npm run build` then `npm test`.
4. For live providers, set OAuth/Twilio keys and `MOCK_MODE=false`; otherwise keep mocked mode enabled.

import { prisma } from "@/db/client";
import { AccountCard } from "./components/AccountCard";
import { InboxTable } from "./components/InboxTable";
import { DraftApprovalPanel } from "./components/DraftApprovalPanel";
import { PersonalizationSettingsPanel } from "./components/PersonalizationSettingsPanel";
import { panelStyle } from "./components/ui";
import { ActivityLogPanel } from "./components/ActivityLogPanel";

export const dynamic = "force-dynamic";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export default async function DashboardPage() {
  const user = await prisma.user.findFirst({
    include: {
      accounts: true,
      rules: true,
      learningItems: {
        orderBy: { createdAt: "desc" },
        take: 12
      },
      emails: {
        orderBy: { receivedAt: "desc" },
        take: 20,
        include: { account: true }
      },
      logs: { orderBy: { createdAt: "desc" }, take: 20 }
    }
  });

  if (!user) return <main style={{ padding: 24 }}>No user found. Run seed.</main>;

  const rules = user.rules[0];
  const drafts = user.emails
    .filter((email) => email.status === "draft_ready")
    .map((email) => ({
      id: email.id,
      subject: email.subject,
      sender: email.senderEmail,
      draft: email.aiDraftReply ?? "",
      riskLevel: email.riskLevel,
      requiresApproval: email.requiresApproval
    }));

  return (
    <main style={{ padding: 24, display: "grid", gap: 24 }}>
      <h1>Oluwatimilehin Assistant Dashboard</h1>

      <section>
        <h2>Connected Accounts</h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
          {user.accounts.length === 0 ? <div style={panelStyle}>No accounts connected yet.</div> : null}
          {user.accounts.map((account) => (
            <AccountCard
              key={account.id}
              provider={account.provider}
              email={account.accountEmail}
              status={account.status}
              notificationsOn={account.notificationsOn}
              draftingEnabled={account.draftingEnabled}
              autoActionsEnabled={account.autoActionsEnabled}
            />
          ))}
        </div>
      </section>

      <section>
        <h2>Unified Inbox</h2>
        <InboxTable
          rows={user.emails.map((email) => ({
            id: email.id,
            provider: email.provider,
            accountEmail: email.account.accountEmail,
            senderEmail: email.senderEmail,
            subject: email.subject,
            triageClass: email.triageClass,
            riskLevel: email.riskLevel,
            requiresApproval: email.requiresApproval
          }))}
        />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        <DraftApprovalPanel drafts={drafts} />
        <PersonalizationSettingsPanel
          importantSenders={asStringArray(rules?.importantSenders)}
          mutedSenders={asStringArray(rules?.mutedSenders)}
          instantSmsCategories={asStringArray(rules?.instantSmsCategories)}
          recentSignals={user.learningItems.map((signal) => ({
            signalType: signal.signalType,
            createdAt: signal.createdAt.toISOString()
          }))}
        />
        <ActivityLogPanel
          items={user.logs.map((log) => ({
            action: log.action,
            status: log.status,
            at: log.createdAt.toISOString(),
            metadata: JSON.stringify(log.metadata)
          }))}
        />
      </section>
    </main>
  );
}

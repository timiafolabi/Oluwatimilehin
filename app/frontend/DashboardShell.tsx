"use client";

import { useEffect, useState } from "react";
import { AccountCard } from "./components/AccountCard";
import { InboxTable } from "./components/InboxTable";
import { DraftApprovalPanel } from "./components/DraftApprovalPanel";
import { PersonalizationSettingsPanel } from "./components/PersonalizationSettingsPanel";
import { ActivityLogPanel } from "./components/ActivityLogPanel";
import { panelStyle } from "./components/ui";

type DashboardPayload = {
  ready: boolean;
  message: string;
  accounts: Array<{
    id: string;
    provider: "gmail" | "outlook";
    email: string;
    status: "connected" | "error" | "needs_reauth";
    notificationsOn: boolean;
    draftingEnabled: boolean;
    autoActionsEnabled: boolean;
  }>;
};

const fallbackPayload: DashboardPayload = {
  ready: false,
  message: "Live data is not configured yet. This safe shell renders without database access.",
  accounts: []
};

export function DashboardShell() {
  const [payload, setPayload] = useState<DashboardPayload>(fallbackPayload);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/frontend-dashboard", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }

        return (await response.json()) as DashboardPayload;
      })
      .then((data) => {
        if (!active) return;
        setPayload(data);
      })
      .catch((error) => {
        if (!active) return;
        setPayload({
          ...fallbackPayload,
          message: error instanceof Error ? error.message : fallbackPayload.message
        });
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main style={{ padding: 24, display: "grid", gap: 24 }}>
      <h1>Oluwatimilehin Assistant Dashboard</h1>

      <section style={panelStyle}>
        <strong>{loading ? "Loading dashboard…" : payload.ready ? "Dashboard ready" : "Safe placeholder mode"}</strong>
        <p style={{ marginTop: 8 }}>{payload.message}</p>
      </section>

      <section>
        <h2>Connected Accounts</h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
          {payload.accounts.length === 0 ? <div style={panelStyle}>No accounts connected yet.</div> : null}
          {payload.accounts.map((account) => (
            <AccountCard
              key={account.id}
              provider={account.provider}
              email={account.email}
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
        <InboxTable rows={[]} />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        <DraftApprovalPanel drafts={[]} />
        <PersonalizationSettingsPanel importantSenders={[]} mutedSenders={[]} instantSmsCategories={[]} recentSignals={[]} />
        <ActivityLogPanel items={[]} />
      </section>
    </main>
  );
}

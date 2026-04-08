"use client";

import { useEffect, useState } from "react";

type DashboardPayload = {
  ready: boolean;
  message: string;
};

const fallbackPayload: DashboardPayload = {
  ready: false,
  message: "Live data is not configured yet. This safe shell renders without database access."
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
    <main style={{ padding: 24, display: "grid", gap: 16 }}>
      <h1>Oluwatimilehin Assistant Dashboard</h1>

      <section style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "white" }}>
        <strong>{loading ? "Loading dashboard…" : payload.ready ? "Dashboard ready" : "Safe placeholder mode"}</strong>
        <p style={{ marginTop: 8 }}>{payload.message}</p>
      </section>

      <section style={{ border: "1px dashed #cbd5e1", borderRadius: 12, padding: 12, background: "#f8fafc" }}>
        <h2 style={{ marginTop: 0 }}>Dashboard Placeholder</h2>
        <p>
          Accounts, inbox, approvals, and activity will appear here after runtime configuration is complete. This shell is
          intentionally database-free during build.
        </p>
      </section>
    </main>
  );
}

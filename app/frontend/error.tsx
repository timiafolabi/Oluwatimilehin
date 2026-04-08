"use client";

export default function DashboardError({ error }: { error: Error }) {
  return (
    <main style={{ padding: 24 }}>
      <h2>Something went wrong loading the dashboard.</h2>
      <p>{error.message}</p>
    </main>
  );
}

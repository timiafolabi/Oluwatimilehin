export default function DashboardPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px 24px",
        display: "grid",
        placeItems: "center",
        background: "#f8fafc",
        fontFamily: "Inter, Arial, sans-serif"
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 720,
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 24,
          background: "#ffffff",
          boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
          display: "grid",
          gap: 8
        }}
      >
        <h1 style={{ margin: 0 }}>Oluwatimilehin Assistant Dashboard</h1>
        <p style={{ margin: 0, fontWeight: 600 }}>Dashboard setup in progress</p>
        <p style={{ margin: 0, color: "#475569" }}>
          Live inbox data will appear after integrations are configured
        </p>
      </section>
    </main>
  );
}

import { panelStyle } from "./ui";

interface InboxRow {
  id: string;
  provider: string;
  accountEmail: string;
  senderEmail: string;
  subject: string;
  triageClass: string;
  riskLevel: string;
  requiresApproval: boolean;
}

export function InboxTable({ rows }: { rows: InboxRow[] }) {
  if (!rows.length) {
    return <div style={panelStyle}>No emails yet. Connect accounts or run ingestion.</div>;
  }

  return (
    <table width="100%" cellPadding={10} style={{ ...panelStyle, borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
          <th>Provider</th>
          <th>Account</th>
          <th>Sender</th>
          <th>Subject</th>
          <th>Class</th>
          <th>Risk</th>
          <th>Approval</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.provider}</td>
            <td>{row.accountEmail}</td>
            <td>{row.senderEmail}</td>
            <td>{row.subject}</td>
            <td>{row.triageClass}</td>
            <td>{row.riskLevel}</td>
            <td>{row.requiresApproval ? "Required" : "Not required"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

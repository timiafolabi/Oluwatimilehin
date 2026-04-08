import { buttonStyle, panelStyle } from "./ui";

interface DraftItem {
  id: string;
  subject: string;
  sender: string;
  draft: string;
  riskLevel: string;
  requiresApproval: boolean;
}

export function DraftApprovalPanel({ drafts }: { drafts: DraftItem[] }) {
  return (
    <div style={panelStyle}>
      <h3>Draft approvals</h3>
      {drafts.length === 0 ? <p>No drafts pending.</p> : null}
      <div style={{ display: "grid", gap: 10 }}>
        {drafts.map((draft) => (
          <div key={draft.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
            <strong>{draft.subject}</strong>
            <div>From: {draft.sender}</div>
            <div>Risk: {draft.riskLevel}</div>
            <p style={{ marginTop: 8 }}>{draft.draft}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" style={buttonStyle}>Approve and send</button>
              <button type="button" style={buttonStyle}>Edit before send</button>
              <button type="button" style={buttonStyle}>Reject draft</button>
            </div>
            {draft.requiresApproval ? <small>Explicit approval required before send.</small> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

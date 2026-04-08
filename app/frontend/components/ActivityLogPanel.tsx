import { panelStyle } from "./ui";

interface ActivityItem {
  action: string;
  status: string;
  at: string;
  metadata: string;
}

export function ActivityLogPanel({ items }: { items: ActivityItem[] }) {
  return (
    <div style={panelStyle}>
      <h3>Activity log</h3>
      {items.length === 0 ? <p>No activity yet.</p> : null}
      <ul style={{ paddingLeft: 16 }}>
        {items.map((item, index) => (
          <li key={`${item.action}-${index}`} style={{ marginBottom: 8 }}>
            <strong>{item.action}</strong> ({item.status})
            <div style={{ fontSize: 12 }}>{item.at}</div>
            <div style={{ fontSize: 12 }}>{item.metadata}</div>
          </li>
        ))}
      </ul>
      <p style={{ fontSize: 12 }}>
        Includes classification reasons, SMS rationale, and draft approval/block decisions when available.
      </p>
    </div>
  );
}

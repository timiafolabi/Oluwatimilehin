import { panelStyle } from "./ui";

interface AccountCardProps {
  provider: string;
  email: string;
  status: string;
  notificationsOn: boolean;
  draftingEnabled: boolean;
  autoActionsEnabled: boolean;
}

export function AccountCard({
  provider,
  email,
  status,
  notificationsOn,
  draftingEnabled,
  autoActionsEnabled
}: AccountCardProps) {
  return (
    <div style={panelStyle}>
      <strong>{provider.toUpperCase()}</strong>
      <div>{email}</div>
      <div>Status: {status}</div>
      <div>Notifications: {notificationsOn ? "On" : "Off"}</div>
      <div>Drafting: {draftingEnabled ? "Enabled" : "Disabled"}</div>
      <div>Auto actions: {autoActionsEnabled ? "Enabled" : "Disabled"}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="button">Toggle notifications</button>
        <button type="button">Toggle drafting</button>
        <button type="button">Toggle auto-actions</button>
      </div>
    </div>
  );
}

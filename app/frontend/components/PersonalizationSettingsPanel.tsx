import { buttonStyle, panelStyle } from "./ui";

interface PersonalizationSettingsPanelProps {
  importantSenders: string[];
  mutedSenders: string[];
  instantSmsCategories: string[];
  recentSignals: Array<{ signalType: string; createdAt: string }>;
}

export function PersonalizationSettingsPanel({
  importantSenders,
  mutedSenders,
  instantSmsCategories,
  recentSignals
}: PersonalizationSettingsPanelProps) {
  return (
    <div style={panelStyle}>
      <h3>Personalization settings</h3>
      <p>Rule-assisted and inspectable scoring (not black-box).</p>

      <strong>Important senders</strong>
      {importantSenders.length ? <ul>{importantSenders.map((sender) => <li key={sender}>{sender}</li>)}</ul> : <p>None set.</p>}

      <strong>Muted senders</strong>
      {mutedSenders.length ? <ul>{mutedSenders.map((sender) => <li key={sender}>{sender}</li>)}</ul> : <p>None set.</p>}

      <strong>Instant SMS categories</strong>
      {instantSmsCategories.length ? (
        <ul>{instantSmsCategories.map((category) => <li key={category}>{category}</li>)}</ul>
      ) : (
        <p>Using default urgent/important categories.</p>
      )}

      <strong>Scoring rules</strong>
      <ul>
        <li>+0.35 important sender</li>
        <li>-0.60 muted sender</li>
        <li>+0.20 instant SMS category match</li>
        <li>+/-0.10 from recent click/ignore/approve/reject signals</li>
      </ul>

      <strong>Recent personalization signals</strong>
      {recentSignals.length ? (
        <ul>
          {recentSignals.map((signal, index) => (
            <li key={`${signal.signalType}-${index}`}>{signal.signalType} ({signal.createdAt})</li>
          ))}
        </ul>
      ) : (
        <p>No personalization signals yet.</p>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" style={buttonStyle}>Edit sender preferences</button>
        <button type="button" style={buttonStyle}>Edit SMS categories</button>
      </div>
    </div>
  );
}

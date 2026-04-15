import { useState } from "react";
import { fe, fp } from "../../fmt.js";

export default function SzenarienSpeichern({ scenarios, inputs, onLoad, onSave, onDelete }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), inputs.adr, inputs);
    setName("");
    setSaving(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 700 }}>
      {/* Save current */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 20, boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 12 }}>Aktuelles Szenario speichern</div>
        <div style={{ fontSize: "0.83rem", color: "var(--text-2)", marginBottom: 12 }}>
          {inputs.adr} — {fe(inputs.kp)} — Miete {fe(inputs.km)}/M — Zins {fp(inputs.z1)}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            placeholder="Name (z.B. Düsseldorf Szenario A)"
            style={{ flex: 1, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "8px 12px", fontSize: "0.9rem", outline: "none" }} />
          <button onClick={handleSave} disabled={saving || !name.trim()}
            style={{ background: "var(--green-500)", color: "#fff", border: "none", borderRadius: "var(--r-sm)", padding: "8px 20px", fontWeight: 700, cursor: "pointer", opacity: saving || !name.trim() ? 0.6 : 1, whiteSpace: "nowrap" }}>
            {saving ? "…" : "Speichern"}
          </button>
        </div>
      </div>

      {/* Saved scenarios */}
      {scenarios.length === 0 ? (
        <p style={{ color: "var(--text-3)", fontSize: "0.9rem" }}>Noch keine gespeicherten Szenarien.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase" }}>Gespeicherte Szenarien ({scenarios.length})</div>
          {scenarios.map(sc => (
            <div key={sc.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "var(--shadow-sm)" }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{sc.name}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>{sc.address} · {new Date(sc.updated_at).toLocaleDateString("de-DE")}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: 2 }}>
                  KP {fe(sc.inputs.kp)} · Miete {fe(sc.inputs.km)}/M · Zins {fp(sc.inputs.z1)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onLoad(sc.inputs)} style={{ background: "var(--green-100)", color: "var(--green-700)", border: "1px solid var(--green-300)", borderRadius: "var(--r-sm)", padding: "6px 14px", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>Laden</button>
                <button onClick={() => onDelete(sc.id)} style={{ background: "var(--bg-subtle)", color: "var(--negative)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "6px 14px", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>Löschen</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

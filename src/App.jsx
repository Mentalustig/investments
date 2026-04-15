import { useState } from "react";
import { useAuth } from "./useAuth.js";
import { useCalculator } from "./useCalculator.js";
import { useScenarios } from "./useScenarios.js";
import Sidebar from "./components/Sidebar.jsx";
import Cockpit from "./components/tabs/Cockpit.jsx";
import Diagramme from "./components/tabs/Diagramme.jsx";
import Szenarien from "./components/tabs/Szenarien.jsx";
import Details from "./components/tabs/Details.jsx";
import { fe, fp, color } from "./fmt.js";

const TABS = ["📊 Cockpit", "📈 Diagramme", "🎲 Szenarien", "📋 Details", "💾 Szenarien speichern"];

// ── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ login }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "48px 56px", boxShadow: "var(--shadow-md)", textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>🏠</div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--green-900)", marginBottom: 8 }}>Immobilien-Kalkulator</h1>
        <p style={{ color: "var(--text-2)", fontSize: "0.92rem", marginBottom: 32, lineHeight: 1.6 }}>
          Professionelle Analyse für Immobilien-Investments.<br />Bitte melde dich mit GitHub an.
        </p>
        <button onClick={login} style={{ background: "var(--dark)", color: "#fff", border: "none", borderRadius: "var(--r-md)", padding: "12px 28px", fontWeight: 700, fontSize: "1rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10, transition: "background 150ms" }}
          onMouseEnter={e => e.target.style.background = "var(--dark-hover)"}
          onMouseLeave={e => e.target.style.background = "var(--dark)"}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
          Mit GitHub anmelden
        </button>
      </div>
    </div>
  );
}

// ── Scenarios Panel ───────────────────────────────────────────────────────────
function ScenariosPanel({ scenarios, inputs, onLoad, onSave, onDelete }) {
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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Save current */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 20, boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 12 }}>Aktuelles Szenario speichern</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (z.B. Wohnung Düsseldorf Szenario A)"
            style={{ flex: 1, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "8px 12px", fontSize: "0.9rem", outline: "none" }} />
          <button onClick={handleSave} disabled={saving || !name.trim()}
            style={{ background: "var(--green-500)", color: "#fff", border: "none", borderRadius: "var(--r-sm)", padding: "8px 18px", fontWeight: 600, cursor: "pointer", opacity: saving || !name.trim() ? 0.6 : 1 }}>
            {saving ? "…" : "Speichern"}
          </button>
        </div>
      </div>

      {/* Saved scenarios */}
      {scenarios.length === 0 ? (
        <p style={{ color: "var(--text-3)", fontSize: "0.9rem" }}>Noch keine gespeicherten Szenarien.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase" }}>Gespeicherte Szenarien ({scenarios.length})</div>
          {scenarios.map(sc => (
            <div key={sc.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "var(--shadow-sm)" }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{sc.name}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>{sc.address} · {new Date(sc.updated_at).toLocaleDateString("de-DE")}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-3)", marginTop: 2 }}>
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

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const { user, login, logout, loading: authLoading } = useAuth();
  const { inputs, update, loadScenario, result, loading, error } = useCalculator();
  const { scenarios, save, remove } = useScenarios(user);
  const [tab, setTab] = useState(0);

  if (authLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ color: "var(--text-2)", fontSize: "0.9rem" }}>Laden…</div>
    </div>
  );

  if (!user) return <LoginScreen login={login} />;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar inputs={inputs} update={update} />

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--green-900)", lineHeight: 1.2 }}>{inputs.adr || "Objekt"}</h1>
            {result && (
              <div style={{ fontSize: "0.8rem", color: "var(--text-2)", marginTop: 2, display: "flex", gap: 16 }}>
                <span>{inputs.wfl} m² · {fe(inputs.kp)}</span>
                <span style={{ fontWeight: 700, color: color(result.s.cfn) }}>CF: {fe(result.s.cfn)}/M</span>
                <span>Rendite: {fp(result.s.br)}</span>
                {loading && <span style={{ color: "var(--text-3)" }}>⟳ Berechne…</span>}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={user.avatar} alt="" style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--green-300)" }} />
            <span style={{ fontSize: "0.85rem", color: "var(--text-2)" }}>{user.name || user.login}</span>
            <button onClick={logout} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "5px 12px", fontSize: "0.8rem", cursor: "pointer", color: "var(--text-2)" }}>Abmelden</button>
          </div>
        </header>

        {/* Tabs */}
        <nav style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 24px", display: "flex", gap: 2, flexShrink: 0 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{ background: "none", border: "none", borderBottom: tab === i ? "2px solid var(--green-500)" : "2px solid transparent", padding: "10px 16px", fontWeight: tab === i ? 700 : 500, fontSize: "0.88rem", color: tab === i ? "var(--green-700)" : "var(--text-2)", cursor: "pointer", transition: "all 150ms", marginBottom: -1 }}>
              {t}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {error && <div style={{ background: "#fde8e8", border: "1px solid var(--negative)", borderRadius: "var(--r-md)", padding: "10px 16px", color: "var(--negative)", marginBottom: 16, fontSize: "0.88rem" }}>Fehler: {error}</div>}

          {tab === 0 && <Cockpit result={result} inputs={inputs} />}
          {tab === 1 && <Diagramme result={result} />}
          {tab === 2 && <Szenarien result={result} inputs={inputs} />}
          {tab === 3 && <Details result={result} inputs={inputs} />}
          {tab === 4 && <ScenariosPanel scenarios={scenarios} inputs={inputs} onLoad={loadScenario} onSave={save} onDelete={remove} />}
        </main>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "./useAuth.js";
import { useCalculator } from "./useCalculator.js";
import { useScenarios } from "./useScenarios.js";
import InputPanel from "./components/InputPanel.jsx";
import VerdictBar from "./components/VerdictBar.jsx";
import Cashflow from "./components/tabs/Cashflow.jsx";
import Rendite from "./components/tabs/Rendite.jsx";
import Optimierung from "./components/tabs/Optimierung.jsx";
import Risiko from "./components/tabs/Risiko.jsx";
import Bankgespraech from "./components/tabs/Bankgespraech.jsx";
import SzenarienSpeichern from "./components/tabs/SzenarienSpeichern.jsx";
import { fe, fp } from "./fmt.js";

const TABS = [
  { id: "cashflow",   label: "Cashflow" },
  { id: "rendite",    label: "Rendite" },
  { id: "optimierung", label: "Optimierung" },
  { id: "risiko",     label: "Risiko" },
  { id: "bank",       label: "Bankgespräch" },
  { id: "szenarien",  label: "💾 Szenarien" },
];

export default function App() {
  const { user } = useAuth();
  const { inputs, update, loadScenario, result, beKm, beZ1, loading, error } = useCalculator();
  const { scenarios, save, remove } = useScenarios(user);
  const [tab, setTab] = useState("cashflow");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Top Header ── */}
      <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "10px 24px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0, boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--green-700)", textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>🏠 Immobilien-Kalkulator</div>
        <div style={{ width: 1, height: 20, background: "var(--border)" }} />

        {/* Inline editable Adresse */}
        <input
          value={inputs.adr}
          onChange={e => update("adr", e.target.value)}
          placeholder="Adresse / Objekt"
          style={{ border: "none", background: "transparent", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-1)", outline: "none", minWidth: 180, flex: 1 }}
        />

        {/* Inline KP */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-3)", textTransform: "uppercase", fontWeight: 600 }}>KP</span>
          <input type="number" value={inputs.kp} onChange={e => update("kp", Number(e.target.value))} step={5000}
            style={{ border: "none", background: "var(--bg-subtle)", borderRadius: "var(--r-sm)", padding: "3px 8px", fontSize: "0.88rem", fontWeight: 600, width: 110, textAlign: "right", outline: "none", color: "var(--text-1)" }} />
          <span style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>€</span>
        </div>

        {/* Inline WFL */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-3)", textTransform: "uppercase", fontWeight: 600 }}>m²</span>
          <input type="number" value={inputs.wfl} onChange={e => update("wfl", Number(e.target.value))} step={5}
            style={{ border: "none", background: "var(--bg-subtle)", borderRadius: "var(--r-sm)", padding: "3px 8px", fontSize: "0.88rem", fontWeight: 600, width: 70, textAlign: "right", outline: "none", color: "var(--text-1)" }} />
          <span style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>m²</span>
        </div>

        <div style={{ flex: 1 }} />
        {loading && <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>⟳ Berechne…</span>}
      </header>

      {/* ── Input Panel ── */}
      <InputPanel inputs={inputs} update={update} />

      {/* ── Verdict Bar ── */}
      <VerdictBar result={result} inputs={inputs} beKm={beKm} beZ1={beZ1} loading={loading} />

      {/* ── Tab Nav ── */}
      <nav style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 24px", display: "flex", gap: 0, flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none",
            borderBottom: tab === t.id ? "2px solid var(--green-500)" : "2px solid transparent",
            padding: "10px 18px", fontWeight: tab === t.id ? 700 : 500,
            fontSize: "0.88rem", color: tab === t.id ? "var(--green-700)" : "var(--text-2)",
            cursor: "pointer", transition: "all 150ms", marginBottom: -1, whiteSpace: "nowrap",
          }}>{t.label}</button>
        ))}
      </nav>

      {/* ── Content ── */}
      <main style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {error && (
          <div style={{ background: "#fde8e8", border: "1px solid var(--negative)", borderRadius: "var(--r-md)", padding: "10px 16px", color: "var(--negative)", marginBottom: 16, fontSize: "0.88rem" }}>
            Fehler: {error}
          </div>
        )}
        {tab === "cashflow"    && <Cashflow result={result} inputs={inputs} />}
        {tab === "rendite"     && <Rendite result={result} inputs={inputs} />}
        {tab === "optimierung" && <Optimierung result={result} inputs={inputs} />}
        {tab === "risiko"      && <Risiko result={result} inputs={inputs} beKm={beKm} beZ1={beZ1} />}
        {tab === "bank"        && <Bankgespraech result={result} inputs={inputs} />}
        {tab === "szenarien"   && <SzenarienSpeichern scenarios={scenarios} inputs={inputs} onLoad={loadScenario} onSave={save} onDelete={remove} />}
      </main>
    </div>
  );
}

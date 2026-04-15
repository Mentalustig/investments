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
  { id: "cashflow",    label: "Cashflow",       icon: "≋" },
  { id: "rendite",     label: "Rendite",         icon: "%" },
  { id: "optimierung", label: "Optimierung",     icon: "◎" },
  { id: "risiko",      label: "Risiko",          icon: "⚡" },
  { id: "bank",        label: "Bankgespräch",    icon: "⊡" },
  { id: "szenarien",   label: "Szenarien",       icon: "◧" },
];

export default function App() {
  const { user } = useAuth();
  const { inputs, update, loadScenario, result, beKm, beZ1, loading, error } = useCalculator();
  const { scenarios, save, remove } = useScenarios(user);
  const [tab, setTab] = useState("cashflow");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Top bar ── */}
      <header style={{
        background: "var(--dark)", color: "#fff",
        padding: "0 24px", height: 52,
        display: "flex", alignItems: "center", gap: 20,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green-300)", whiteSpace: "nowrap" }}>
          Immobilien-Kalkulator
        </span>

        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.15)" }} />

        <input
          value={inputs.adr}
          onChange={e => update("adr", e.target.value)}
          placeholder="Adresse / Objektbezeichnung"
          style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "0.92rem", fontWeight: 600, flex: 1, minWidth: 0 }}
        />

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <InlineNum label="KP" value={inputs.kp} step={5000} onChange={v => update("kp", v)} suffix="€" width={110} />
          <InlineNum label="m²" value={inputs.wfl} step={5} onChange={v => update("wfl", v)} suffix="m²" width={70} />
        </div>

        {loading && (
          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>berechnet…</span>
        )}
      </header>

      {/* ── Inputs ── */}
      <InputPanel inputs={inputs} update={update} />

      {/* ── Verdict ── */}
      <VerdictBar result={result} inputs={inputs} beKm={beKm} beZ1={beZ1} loading={loading} />

      {/* ── Tabs ── */}
      <nav style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 24px", display: "flex", flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none",
            borderBottom: tab === t.id ? "2px solid var(--green-500)" : "2px solid transparent",
            padding: "11px 16px",
            fontSize: "0.84rem",
            fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? "var(--green-700)" : "var(--text-2)",
            cursor: "pointer",
            marginBottom: -1,
            whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 6,
            transition: "color 150ms",
          }}>
            <span style={{ fontSize: "0.9rem", opacity: 0.7 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── Content ── */}
      <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {error && (
          <div style={{ background: "var(--negative-bg)", border: "1px solid var(--negative-border)", borderRadius: "var(--r-md)", padding: "10px 16px", color: "var(--negative)", marginBottom: 16, fontSize: "0.86rem" }}>
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

function InlineNum({ label, value, step, onChange, suffix, width }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}>{label}</span>
      <input type="number" value={value} step={step} onChange={e => onChange(Number(e.target.value))}
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "var(--r-sm)", padding: "3px 8px", color: "#fff", fontWeight: 600, fontSize: "0.84rem", width, textAlign: "right", outline: "none" }} />
      <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)" }}>{suffix}</span>
    </div>
  );
}

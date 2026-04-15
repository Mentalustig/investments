import { useState } from "react";
import { NumInput, Select, SliderInput, Toggle, Field } from "./ui/Input.jsx";
import Divider from "./ui/Divider.jsx";

const BUNDESLAENDER = [
  "Baden-Württemberg","Bayern","Berlin","Brandenburg","Bremen","Hamburg",
  "Hessen","Mecklenburg-Vorpommern","Niedersachsen","Nordrhein-Westfalen",
  "Rheinland-Pfalz","Saarland","Sachsen","Sachsen-Anhalt","Schleswig-Holstein","Thüringen"
];
const BAUJAHRE = ["vor 1925","1925-1950","1951-1960","1961-1970","1971-1980","1981-1990","1991-2000","2001-2010","ab 2010"];
const PRESETS = {
  "Basis (100% Bank)":    { d1p:1.0, z1:0.0377, t1:0.01, d2s:0, z2:0, t2:0, km:700, ga:0.8 },
  "Optimiert (Bauspar)":  { d1p:0.33, z1:0.034, t1:0.01, d2s:47000, z2:0.015, t2:0.065, km:750, ga:0.9 },
  "Cashflow-Max":         { d1p:0.17, z1:0.032, t1:0.01, d2s:47000, z2:0.015, t2:0.065, km:800, ga:0.9 },
};

const S = {
  sidebar: { width: 280, minWidth: 280, height: "100vh", overflowY: "auto", background: "var(--dark)", display: "flex", flexDirection: "column", padding: "0 0 32px" },
  header: { padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" },
  logo: { fontSize: "0.7rem", fontWeight: 700, color: "var(--green-300)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 },
  title: { fontSize: "1.1rem", fontWeight: 800, color: "var(--dark-text-em)", lineHeight: 1.2 },
  body: { padding: "12px 16px", flex: 1 },
  section: { marginBottom: 20 },
  // Override inputs for dark background
  inp: { "--inp-bg": "rgba(255,255,255,0.07)", "--inp-border": "rgba(255,255,255,0.15)", "--inp-text": "#e8e8e8" },
};

const darkInput = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "var(--r-sm)",
  padding: "7px 10px",
  fontSize: "0.88rem",
  color: "#e8e8e8",
  width: "100%",
  outline: "none",
};
const darkLabel = { fontSize: "0.68rem", fontWeight: 600, color: "var(--dark-text)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3, display: "block" };

function DField({ label, children }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 3 }}><label style={darkLabel}>{label}</label>{children}</div>;
}
function DNum({ label, value, onChange, min, max, step = 1, suffix }) {
  return (
    <DField label={label}>
      <div style={{ position: "relative" }}>
        <input type="number" style={{ ...darkInput, paddingRight: suffix ? 36 : 10 }}
          value={value} min={min} max={max} step={step}
          onChange={e => onChange(Number(e.target.value))} />
        {suffix && <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--dark-text)", fontSize: "0.75rem" }}>{suffix}</span>}
      </div>
    </DField>
  );
}
function DSel({ label, value, onChange, options }) {
  return (
    <DField label={label}>
      <select style={{ ...darkInput, cursor: "pointer" }} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o} style={{ background: "#1a2e1a" }}>{o.label ?? o}</option>)}
      </select>
    </DField>
  );
}
function DSlider({ label, value, onChange, min, max, step, display }) {
  return (
    <DField label={`${label}: ${display ?? value}`}>
      <input type="range" style={{ width: "100%", accentColor: "var(--green-300)" }}
        value={value} min={min} max={max} step={step}
        onChange={e => onChange(Number(e.target.value))} />
    </DField>
  );
}
function DToggle({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => onChange(!value)}>
      <div style={{ width: 32, height: 18, borderRadius: 9, background: value ? "var(--green-300)" : "rgba(255,255,255,0.2)", position: "relative", transition: "background 150ms", flexShrink: 0 }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: value ? 16 : 2, transition: "left 150ms" }} />
      </div>
      <span style={{ fontSize: "0.82rem", color: "var(--dark-text)" }}>{label}</span>
    </div>
  );
}

export default function Sidebar({ inputs, update }) {
  const [preset, setPreset] = useState("Eigene Eingaben");
  const [openSection, setOpenSection] = useState("objekt");

  function applyPreset(name) {
    setPreset(name);
    if (PRESETS[name]) Object.entries(PRESETS[name]).forEach(([k, v]) => update(k, v));
  }

  function Section({ id, title, children }) {
    const open = openSection === id;
    return (
      <div style={{ marginBottom: 4 }}>
        <button onClick={() => setOpenSection(open ? null : id)} style={{ width: "100%", background: "none", border: "none", padding: "8px 0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", color: open ? "var(--dark-text-em)" : "var(--dark-text)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {title}
          <span style={{ fontSize: 16, transition: "transform 200ms", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
        </button>
        {open && <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 12 }}>{children}</div>}
      </div>
    );
  }

  return (
    <aside style={S.sidebar}>
      <div style={S.header}>
        <div style={S.logo}>Investment Tools</div>
        <div style={S.title}>Immobilien-<br />Kalkulator</div>
      </div>

      <div style={{ padding: "10px 16px 0" }}>
        <DSel label="Schnellstart" value={preset} onChange={applyPreset}
          options={["Eigene Eingaben", ...Object.keys(PRESETS)]} />
      </div>

      <div style={{ padding: "4px 16px", flex: 1 }}>
        {/* ── Objekt ── */}
        <Section id="objekt" title="Objekt">
          <DField label="Adresse">
            <input style={darkInput} value={inputs.adr} onChange={e => update("adr", e.target.value)} />
          </DField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <DNum label="Wohnfläche m²" value={inputs.wfl} onChange={v => update("wfl", v)} min={10} max={1000} step={5} />
            <DNum label="Kaufpreis €" value={inputs.kp} onChange={v => update("kp", v)} min={10000} step={5000} />
          </div>
          <DNum label="Kaltmiete €/M" value={inputs.km} onChange={v => update("km", v)} min={0} step={25} />
          <DSel label="Bundesland" value={inputs.bl} onChange={v => update("bl", v)} options={BUNDESLAENDER} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            <DNum label="Makler %" value={inputs.mk * 100} onChange={v => update("mk", v / 100)} min={0} max={10} step={0.5} suffix="%" />
            <DNum label="Notar %" value={inputs.no * 100} onChange={v => update("no", v / 100)} min={0} max={5} step={0.1} suffix="%" />
            <DNum label="Grundb. %" value={inputs.gb * 100} onChange={v => update("gb", v / 100)} min={0} max={2} step={0.1} suffix="%" />
          </div>
          <DNum label="Anfangsinvest. €" value={inputs.inv} onChange={v => update("inv", v)} min={0} step={1000} />
        </Section>

        {/* ── Finanzierung ── */}
        <Section id="finanz" title="Finanzierung">
          <DSlider label="Darlehen I (% KP)" value={Math.round(inputs.d1p * 100)} onChange={v => update("d1p", v / 100)} min={0} max={110} step={5} display={`${Math.round(inputs.d1p * 100)}%`} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <DNum label="Zins I %" value={(inputs.z1 * 100).toFixed(2)} onChange={v => update("z1", v / 100)} min={0} max={15} step={0.01} suffix="%" />
            <DNum label="Tilgung I %" value={(inputs.t1 * 100).toFixed(1)} onChange={v => update("t1", v / 100)} min={0} max={15} step={0.1} suffix="%" />
          </div>
          <DNum label="Zinsbindung Jahre" value={inputs.zfest ?? 10} onChange={v => update("zfest", v)} min={1} max={30} />
          <DNum label="Darlehen II € (Bauspar)" value={inputs.d2s} onChange={v => update("d2s", v)} min={0} step={1000} />
          {inputs.d2s > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <DNum label="Zins II %" value={(inputs.z2 * 100).toFixed(2)} onChange={v => update("z2", v / 100)} min={0} max={15} step={0.01} suffix="%" />
              <DNum label="Tilgung II %" value={(inputs.t2 * 100).toFixed(1)} onChange={v => update("t2", v / 100)} min={0} max={15} step={0.1} suffix="%" />
            </div>
          )}
        </Section>

        {/* ── Bewirtschaftung ── */}
        <Section id="bewirt" title="Bewirtschaftung">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <DNum label="Hausgeld n.u. €/M" value={inputs.hg} onChange={v => update("hg", v)} min={0} step={10} />
            <DNum label="Grundsteuer €/M" value={inputs.gsm} onChange={v => update("gsm", v)} min={0} step={5} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <DNum label="IH-Rücklage €/m²/J" value={inputs.ihq} onChange={v => update("ihq", v)} min={0} max={50} step={1} />
            <DNum label="Mietausfall %" value={inputs.ma * 100} onChange={v => update("ma", v / 100)} min={0} max={30} step={1} suffix="%" />
          </div>
        </Section>

        {/* ── Prognose ── */}
        <Section id="prognose" title="Prognose">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <DNum label="Mietstg. %/J" value={inputs.mst * 100} onChange={v => update("mst", v / 100)} min={0} max={10} step={0.5} suffix="%" />
            <DNum label="Kostenst. %/J" value={inputs.kst * 100} onChange={v => update("kst", v / 100)} min={0} max={10} step={0.5} suffix="%" />
          </div>
          <DNum label="Wertstg. %/J" value={inputs.wst * 100} onChange={v => update("wst", v / 100)} min={-5} max={15} step={0.5} suffix="%" />
          <DSel label="Baujahr" value={inputs.bj} onChange={v => update("bj", v)} options={BAUJAHRE} />
          <DSlider label="Gebäudeanteil" value={Math.round(inputs.ga * 100)} onChange={v => update("ga", v / 100)} min={0} max={100} step={5} display={`${Math.round(inputs.ga * 100)}%`} />
        </Section>

        {/* ── Steuer ── */}
        <Section id="steuer" title="Steuer">
          <DSel label="Veranlagung" value={inputs.vl} onChange={v => update("vl", v)} options={["Einzeln", "Gemeinsam"]} />
          <DNum label="zvE €/Jahr" value={inputs.zve} onChange={v => update("zve", v)} min={0} step={5000} />
          <DToggle label="Kirchensteuer" value={inputs.ki} onChange={v => update("ki", v)} />
        </Section>
      </div>
    </aside>
  );
}

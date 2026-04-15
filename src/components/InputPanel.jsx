import { useState } from "react";

const BUNDESLAENDER = [
  "Baden-Württemberg","Bayern","Berlin","Brandenburg","Bremen","Hamburg",
  "Hessen","Mecklenburg-Vorpommern","Niedersachsen","Nordrhein-Westfalen",
  "Rheinland-Pfalz","Saarland","Sachsen","Sachsen-Anhalt","Schleswig-Holstein","Thüringen"
];
const BAUJAHRE = ["vor 1925","1925-1950","1951-1960","1961-1970","1971-1980","1981-1990","1991-2000","2001-2010","ab 2010"];
const GREST = {"Baden-Württemberg":0.05,"Bayern":0.035,"Berlin":0.06,"Brandenburg":0.065,"Bremen":0.05,"Hamburg":0.055,"Hessen":0.06,"Mecklenburg-Vorpommern":0.06,"Niedersachsen":0.05,"Nordrhein-Westfalen":0.065,"Rheinland-Pfalz":0.05,"Saarland":0.065,"Sachsen":0.055,"Sachsen-Anhalt":0.05,"Schleswig-Holstein":0.065,"Thüringen":0.065};

// Shared field styles
const fieldLabel = {
  fontSize: "0.67rem", fontWeight: 700, color: "var(--text-3)",
  textTransform: "uppercase", letterSpacing: "0.05em",
  marginBottom: 4, display: "block",
};
const fieldInput = {
  width: "100%", background: "var(--surface)",
  border: "1px solid var(--border)", borderRadius: "var(--r-sm)",
  padding: "6px 10px", fontSize: "0.88rem", color: "var(--text-1)",
  outline: "none", transition: "border-color 150ms",
};
const fieldHint = { fontSize: "0.63rem", color: "var(--text-3)", marginTop: 3, display: "block" };

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={fieldLabel}>{label}</label>
      {children}
      {hint && <span style={fieldHint}>{hint}</span>}
    </div>
  );
}

function Num({ value, onChange, min, max, step = 1, suffix }) {
  return (
    <div style={{ position: "relative" }}>
      <input type="number"
        style={{ ...fieldInput, paddingRight: suffix ? 32 : 10 }}
        value={value} min={min} max={max} step={step}
        onChange={e => onChange(Number(e.target.value))}
        onFocus={e => e.target.style.borderColor = "var(--green-400)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
      {suffix && (
        <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", fontSize: "0.72rem", pointerEvents: "none", userSelect: "none" }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select style={{ ...fieldInput, cursor: "pointer" }} value={value} onChange={e => onChange(e.target.value)}
      onFocus={e => e.target.style.borderColor = "var(--green-400)"}
      onBlur={e => e.target.style.borderColor = "var(--border)"}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  );
}

function Grid({ cols = 4, gap = 14, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }}>
      {children}
    </div>
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 2 }} onClick={() => onChange(!value)}>
      <div style={{ width: 34, height: 19, borderRadius: 10, background: value ? "var(--green-500)" : "var(--border-strong)", position: "relative", transition: "background 150ms", flexShrink: 0 }}>
        <div style={{ width: 15, height: 15, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: value ? 17 : 2, transition: "left 150ms", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }} />
      </div>
      <span style={{ fontSize: "0.84rem", color: "var(--text-2)" }}>{label}</span>
    </div>
  );
}

// Compact summary shown on collapsed tab
function tabSummary(id, inp) {
  const pct = v => `${(v * 100).toFixed(1)}%`;
  switch (id) {
    case "finanz":   return `${Math.round(inp.d1p * 100)}% FK · ${pct(inp.z1)} Zins · ${inp.zfest ?? 10}J Bindung`;
    case "miete":    return `${inp.km} €/M · ${inp.gsm} € NK · ${Math.round(inp.ma * 100)}% Ausfall`;
    case "kosten":   return `${inp.ihq} €/m²/J IH · ${pct(inp.no + inp.gb + inp.mk)} Nebenkosten`;
    case "prognose": return `Wert +${pct(inp.wst)}/J · Miete +${pct(inp.mst)}/J`;
    default: return "";
  }
}

const TABS = [
  { id: "finanz",   label: "Finanzierung" },
  { id: "miete",    label: "Mieteinnahmen" },
  { id: "kosten",   label: "Kosten & Steuern" },
  { id: "prognose", label: "Prognose" },
];

export default function InputPanel({ inputs, update }) {
  const [active, setActive] = useState("finanz");

  return (
    <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
      {/* Tab strip */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 24px", gap: 2 }}>
        {TABS.map(t => (
          <button key={t.id}
            onClick={() => setActive(active === t.id ? null : t.id)}
            style={{
              background: active === t.id ? "var(--green-50)" : "none",
              border: "none",
              borderBottom: active === t.id ? "2px solid var(--green-500)" : "2px solid transparent",
              padding: "9px 16px",
              cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "flex-start",
              marginBottom: -1, minWidth: 0, borderRadius: "var(--r-sm) var(--r-sm) 0 0",
              transition: "background 150ms",
            }}>
            <span style={{ fontSize: "0.82rem", fontWeight: active === t.id ? 700 : 600, color: active === t.id ? "var(--green-700)" : "var(--text-1)", whiteSpace: "nowrap" }}>
              {t.label}
            </span>
            {active !== t.id && (
              <span style={{ fontSize: "0.65rem", color: "var(--text-3)", whiteSpace: "nowrap", marginTop: 2, fontWeight: 400 }}>
                {tabSummary(t.id, inputs)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panel */}
      {active && (
        <div style={{ padding: "16px 24px 18px", background: "var(--green-50)" }}>

          {active === "finanz" && (
            <Grid cols={6}>
              <Field label="Darlehen (% KP)" hint={`= ${((inputs.d1p * inputs.kp) / 1000).toFixed(0)} k€ Kredit`}>
                <Num value={Math.round(inputs.d1p * 100)} onChange={v => update("d1p", v / 100)} min={0} max={120} step={5} suffix="%" />
              </Field>
              <Field label="Zinssatz">
                <Num value={(inputs.z1 * 100).toFixed(2)} onChange={v => update("z1", v / 100)} min={0} max={15} step={0.05} suffix="%" />
              </Field>
              <Field label="Tilgung">
                <Num value={(inputs.t1 * 100).toFixed(1)} onChange={v => update("t1", v / 100)} min={0} max={10} step={0.1} suffix="%" />
              </Field>
              <Field label="Zinsbindung" hint="Jahre bis Anschlussfinanz.">
                <Num value={inputs.zfest ?? 10} onChange={v => update("zfest", v)} min={1} max={30} step={1} suffix="J" />
              </Field>
              <Field label="Anschlusszins" hint="Geschätzter Zins nach Ablauf">
                <Num value={(inputs.zans * 100).toFixed(2)} onChange={v => update("zans", v / 100)} min={0} max={15} step={0.05} suffix="%" />
              </Field>
              <Field label="2. Darlehen (KfW/Bauspar)" hint="0 = nicht vorhanden">
                <Num value={inputs.d2s} onChange={v => update("d2s", v)} min={0} step={5000} />
              </Field>
              {inputs.d2s > 0 && <>
                <Field label="Zins II">
                  <Num value={(inputs.z2 * 100).toFixed(2)} onChange={v => update("z2", v / 100)} min={0} max={15} step={0.01} suffix="%" />
                </Field>
                <Field label="Tilgung II">
                  <Num value={(inputs.t2 * 100).toFixed(1)} onChange={v => update("t2", v / 100)} min={0} max={15} step={0.1} suffix="%" />
                </Field>
              </>}
            </Grid>
          )}

          {active === "miete" && (
            <Grid cols={5}>
              <Field label="Kaltmiete" hint="Monatlich ohne Nebenkosten">
                <Num value={inputs.km} onChange={v => update("km", v)} min={0} step={25} suffix="€" />
              </Field>
              <Field label="Grundsteuer & NK" hint="Nicht umlagefähige Nebenkosten/M">
                <Num value={inputs.gsm} onChange={v => update("gsm", v)} min={0} step={10} suffix="€" />
              </Field>
              <Field label="Hausgeld (WEG)" hint="Nicht umlagefähiger Anteil/M">
                <Num value={inputs.hg} onChange={v => update("hg", v)} min={0} step={10} suffix="€" />
              </Field>
              <Field label="Mietausfallrisiko" hint="Leerstand + Zahlungsausfall">
                <Num value={Math.round(inputs.ma * 100)} onChange={v => update("ma", v / 100)} min={0} max={30} step={1} suffix="%" />
              </Field>
              <Field label="Bundesland" hint={`GrESt: ${((GREST[inputs.bl] ?? 0.065) * 100).toFixed(1)} %`}>
                <Select value={inputs.bl} onChange={v => update("bl", v)} options={BUNDESLAENDER} />
              </Field>
            </Grid>
          )}

          {active === "kosten" && (
            <Grid cols={5}>
              <Field label="Instandhaltung & Erneuerung" hint="Rücklage für Dach, Heizung etc. Standard: 8–12 €">
                <Num value={inputs.ihq} onChange={v => update("ihq", v)} min={0} max={50} step={1} suffix="€/m²/J" />
              </Field>
              <Field label="Renovierung / Sanierung" hint="Einmalige Investition vor Einzug">
                <Num value={inputs.inv} onChange={v => update("inv", v)} min={0} step={5000} suffix="€" />
              </Field>
              <Field label="Makler" hint="% vom Kaufpreis">
                <Num value={(inputs.mk * 100).toFixed(1)} onChange={v => update("mk", v / 100)} min={0} max={10} step={0.5} suffix="%" />
              </Field>
              <Field label="Notar">
                <Num value={(inputs.no * 100).toFixed(1)} onChange={v => update("no", v / 100)} min={0} max={5} step={0.1} suffix="%" />
              </Field>
              <Field label="Grundbuch">
                <Num value={(inputs.gb * 100).toFixed(1)} onChange={v => update("gb", v / 100)} min={0} max={2} step={0.1} suffix="%" />
              </Field>
              <Field label="Baujahr" hint="Bestimmt AfA-Satz (2% oder 2,5%)">
                <Select value={inputs.bj} onChange={v => update("bj", v)} options={BAUJAHRE} />
              </Field>
              <Field label="Gebäudeanteil" hint="Für AfA (Boden nicht absetzbar)">
                <Num value={Math.round(inputs.ga * 100)} onChange={v => update("ga", v / 100)} min={0} max={100} step={5} suffix="%" />
              </Field>
              <Field label="Steuerveranlagung">
                <Select value={inputs.vl} onChange={v => update("vl", v)} options={["Einzeln", "Gemeinsam"]} />
              </Field>
              <Field label="Zu versteuerndes Einkommen" hint="Für Grenzsteuersatz">
                <Num value={inputs.zve} onChange={v => update("zve", v)} min={0} step={5000} suffix="€/J" />
              </Field>
              <Field label="Kirchensteuer">
                <Toggle value={inputs.ki} onChange={v => update("ki", v)} label={inputs.ki ? "Ja" : "Nein"} />
              </Field>
            </Grid>
          )}

          {active === "prognose" && (
            <Grid cols={4}>
              <Field label="Mietsteigerung p.a." hint="Indexmiete ≈ 2–3 % historisch">
                <Num value={(inputs.mst * 100).toFixed(1)} onChange={v => update("mst", v / 100)} min={0} max={10} step={0.5} suffix="%" />
              </Field>
              <Field label="Wertsteigerung p.a." hint="Immo DE: ~2–3 % langfristig">
                <Num value={(inputs.wst * 100).toFixed(1)} onChange={v => update("wst", v / 100)} min={-5} max={15} step={0.5} suffix="%" />
              </Field>
              <Field label="Kostensteigerung p.a." hint="NK + IH Inflation">
                <Num value={(inputs.kst * 100).toFixed(1)} onChange={v => update("kst", v / 100)} min={0} max={10} step={0.5} suffix="%" />
              </Field>
              <Field label="Anfangsinvestition" hint="Sanierung vor Einzug (einmalig)">
                <Num value={inputs.inv} onChange={v => update("inv", v)} min={0} step={5000} suffix="€" />
              </Field>
            </Grid>
          )}
        </div>
      )}
    </div>
  );
}

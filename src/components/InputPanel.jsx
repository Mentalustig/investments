import { useState } from "react";

const BUNDESLAENDER = [
  "Baden-Württemberg","Bayern","Berlin","Brandenburg","Bremen","Hamburg",
  "Hessen","Mecklenburg-Vorpommern","Niedersachsen","Nordrhein-Westfalen",
  "Rheinland-Pfalz","Saarland","Sachsen","Sachsen-Anhalt","Schleswig-Holstein","Thüringen"
];
const BAUJAHRE = ["vor 1925","1925-1950","1951-1960","1961-1970","1971-1980","1981-1990","1991-2000","2001-2010","ab 2010"];

const lbl = { fontSize: "0.68rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3, display: "block" };
const inp = { width: "100%", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "6px 10px", fontSize: "0.88rem", color: "var(--text-1)", outline: "none", boxSizing: "border-box" };
const hint = { fontSize: "0.62rem", color: "var(--text-3)", marginTop: 2, display: "block" };

function F({ label, children, tip }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={lbl}>{label}</label>
      {children}
      {tip && <span style={hint}>{tip}</span>}
    </div>
  );
}

function N({ value, onChange, min, max, step = 1, suffix, wide }) {
  return (
    <div style={{ position: "relative" }}>
      <input type="number" style={{ ...inp, paddingRight: suffix ? 30 : 10, width: wide || "100%" }}
        value={value} min={min} max={max} step={step}
        onChange={e => onChange(Number(e.target.value))} />
      {suffix && <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", fontSize: "0.72rem", pointerEvents: "none" }}>{suffix}</span>}
    </div>
  );
}

function Sel({ value, onChange, options }) {
  return (
    <select style={{ ...inp, cursor: "pointer" }} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  );
}

function Grid({ cols = 4, children }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>{children}</div>;
}

// Summary lines shown when tab is collapsed
function summaryOf(id, inp) {
  const fp = v => `${(v * 100).toFixed(1)}%`;
  const fe = v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);
  switch (id) {
    case "finanz":   return `${fe(inp.d1p * 100)}% · ${fp(inp.z1)} · ${inp.zfest}J Bindung`;
    case "miete":    return `${inp.km}€/M · ${inp.gsm}€ NK · ${inp.ma * 100}% Ausfall`;
    case "kosten":   return `${inp.ihq}€/m²/J · ${fp(inp.no + inp.gb + inp.mk)} NK · GST ${(inp.zve / 1000).toFixed(0)}k`;
    case "prognose": return `Wert +${fp(inp.wst)}/J · Miete +${fp(inp.mst)}/J`;
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
    <div style={{ background: "var(--surface)", borderBottom: "2px solid var(--border)", flexShrink: 0 }}>
      {/* Tab row */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 24px" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActive(active === t.id ? null : t.id)}
            style={{ background: "none", border: "none", borderBottom: active === t.id ? "2px solid var(--green-500)" : "2px solid transparent", padding: "8px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: -1, minWidth: 0 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: active === t.id ? 700 : 600, color: active === t.id ? "var(--green-700)" : "var(--text-1)", whiteSpace: "nowrap" }}>{t.label}</span>
            {active !== t.id && (
              <span style={{ fontSize: "0.68rem", color: "var(--text-3)", whiteSpace: "nowrap", marginTop: 1 }}>{summaryOf(t.id, inputs)}</span>
            )}
          </button>
        ))}
      </div>

      {/* Active panel */}
      {active && (
        <div style={{ padding: "14px 24px 16px" }}>
          {active === "finanz" && (
            <Grid cols={5}>
              <F label="Darlehen % KP" tip={`= ${((inputs.d1p * inputs.kp) / 1000).toFixed(0)}k € Darlehen`}>
                <N value={Math.round(inputs.d1p * 100)} onChange={v => update("d1p", v / 100)} min={0} max={120} step={5} suffix="%" />
              </F>
              <F label="Zinssatz">
                <N value={(inputs.z1 * 100).toFixed(2)} onChange={v => update("z1", v / 100)} min={0} max={15} step={0.05} suffix="%" />
              </F>
              <F label="Tilgung">
                <N value={(inputs.t1 * 100).toFixed(1)} onChange={v => update("t1", v / 100)} min={0} max={15} step={0.1} suffix="%" />
              </F>
              <F label="Zinsbindung" tip="Jahre bis Anschlussfinanzierung">
                <N value={inputs.zfest ?? 10} onChange={v => update("zfest", v)} min={1} max={30} step={1} suffix="J" />
              </F>
              <F label="Anschlusszins" tip="Zins nach Zinsbindungsende">
                <N value={(inputs.zans * 100).toFixed(2)} onChange={v => update("zans", v / 100)} min={0} max={15} step={0.05} suffix="%" />
              </F>
              {inputs.d2s > 0 && <>
                <F label="Darlehen II €" tip="z.B. Bauspar"><N value={inputs.d2s} onChange={v => update("d2s", v)} min={0} step={1000} /></F>
                <F label="Zins II"><N value={(inputs.z2 * 100).toFixed(2)} onChange={v => update("z2", v / 100)} min={0} max={15} step={0.01} suffix="%" /></F>
                <F label="Tilgung II"><N value={(inputs.t2 * 100).toFixed(1)} onChange={v => update("t2", v / 100)} min={0} max={15} step={0.1} suffix="%" /></F>
              </>}
              <F label="+ Darlehen II" tip="Bauspar / KfW">
                <N value={inputs.d2s} onChange={v => update("d2s", v)} min={0} step={5000} />
              </F>
            </Grid>
          )}

          {active === "miete" && (
            <Grid cols={4}>
              <F label="Kaltmiete" tip="Monatlich ohne NK">
                <N value={inputs.km} onChange={v => update("km", v)} min={0} step={25} suffix="€" />
              </F>
              <F label="Grundsteuer & NK" tip="Nicht umlagefähige Nebenkosten/M">
                <N value={inputs.gsm} onChange={v => update("gsm", v)} min={0} step={10} suffix="€" />
              </F>
              <F label="Hausgeld (WEG)" tip="Nicht umlagefähiger Anteil/M">
                <N value={inputs.hg} onChange={v => update("hg", v)} min={0} step={10} suffix="€" />
              </F>
              <F label="Mietausfall" tip="Leerstand + Mietausfall-Risiko">
                <N value={Math.round(inputs.ma * 100)} onChange={v => update("ma", v / 100)} min={0} max={30} step={1} suffix="%" />
              </F>
              <F label="Bundesland" tip={`GrESt: ${(({
                "Bayern":0.035,"Baden-Württemberg":0.05,"Berlin":0.06,"Brandenburg":0.065,"Bremen":0.05,"Hamburg":0.055,"Hessen":0.06,"Mecklenburg-Vorpommern":0.06,"Niedersachsen":0.05,"Nordrhein-Westfalen":0.065,"Rheinland-Pfalz":0.05,"Saarland":0.065,"Sachsen":0.055,"Sachsen-Anhalt":0.05,"Schleswig-Holstein":0.065,"Thüringen":0.065
              })[inputs.bl]*100).toFixed(1)}%`}>
                <Sel value={inputs.bl} onChange={v => update("bl", v)} options={BUNDESLAENDER} />
              </F>
            </Grid>
          )}

          {active === "kosten" && (
            <Grid cols={5}>
              <F label="Instandhaltung & Erneuerung" tip="Rücklage für Dach, Heizung etc. Standard: 8–12 €">
                <N value={inputs.ihq} onChange={v => update("ihq", v)} min={0} max={50} step={1} suffix="€/m²/J" />
              </F>
              <F label="Anfangsinvestition" tip="Renovierung / Sanierung vor Einzug">
                <N value={inputs.inv} onChange={v => update("inv", v)} min={0} step={5000} suffix="€" />
              </F>
              <F label="Makler" tip="% vom Kaufpreis">
                <N value={(inputs.mk * 100).toFixed(1)} onChange={v => update("mk", v / 100)} min={0} max={10} step={0.5} suffix="%" />
              </F>
              <F label="Notar">
                <N value={(inputs.no * 100).toFixed(1)} onChange={v => update("no", v / 100)} min={0} max={5} step={0.1} suffix="%" />
              </F>
              <F label="Grundbuch">
                <N value={(inputs.gb * 100).toFixed(1)} onChange={v => update("gb", v / 100)} min={0} max={2} step={0.1} suffix="%" />
              </F>
              <F label="Veranlagung Steuer">
                <Sel value={inputs.vl} onChange={v => update("vl", v)} options={["Einzeln", "Gemeinsam"]} />
              </F>
              <F label="Zu versteuerndes Einkommen" tip="Für Grenzsteuersatz-Berechnung">
                <N value={inputs.zve} onChange={v => update("zve", v)} min={0} step={5000} suffix="€/J" />
              </F>
              <F label="Baujahr" tip="Bestimmt AfA-Satz (2% oder 2,5%)">
                <Sel value={inputs.bj} onChange={v => update("bj", v)} options={BAUJAHRE} />
              </F>
              <F label="Gebäudeanteil" tip="Für AfA-Basis (Boden nicht absetzbar)">
                <N value={Math.round(inputs.ga * 100)} onChange={v => update("ga", v / 100)} min={0} max={100} step={5} suffix="%" />
              </F>
              <F label="Kirchensteuer">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, cursor: "pointer" }} onClick={() => update("ki", !inputs.ki)}>
                  <div style={{ width: 32, height: 18, borderRadius: 9, background: inputs.ki ? "var(--green-500)" : "var(--border)", position: "relative", transition: "background 150ms", flexShrink: 0 }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: inputs.ki ? 16 : 2, transition: "left 150ms" }} />
                  </div>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-2)" }}>{inputs.ki ? "Ja" : "Nein"}</span>
                </div>
              </F>
            </Grid>
          )}

          {active === "prognose" && (
            <Grid cols={4}>
              <F label="Mietsteigerung p.a." tip="Indexmiete ≈ 2–3% historisch">
                <N value={(inputs.mst * 100).toFixed(1)} onChange={v => update("mst", v / 100)} min={0} max={10} step={0.5} suffix="%" />
              </F>
              <F label="Wertsteigerung p.a." tip="Immobilien DE: ~2–3% historisch">
                <N value={(inputs.wst * 100).toFixed(1)} onChange={v => update("wst", v / 100)} min={-5} max={15} step={0.5} suffix="%" />
              </F>
              <F label="Kostensteigerung p.a." tip="NK + IH Inflation">
                <N value={(inputs.kst * 100).toFixed(1)} onChange={v => update("kst", v / 100)} min={0} max={10} step={0.5} suffix="%" />
              </F>
              <F label="Anfangsinvestition" tip="Sanierung / Modernisierung">
                <N value={inputs.inv} onChange={v => update("inv", v)} min={0} step={5000} suffix="€" />
              </F>
            </Grid>
          )}
        </div>
      )}
    </div>
  );
}

import { fe, fp } from "../../fmt.js";

const GREST = {
  "Baden-Württemberg": 0.05, "Bayern": 0.035, "Berlin": 0.06,
  "Brandenburg": 0.065, "Bremen": 0.05, "Hamburg": 0.055,
  "Hessen": 0.06, "Mecklenburg-Vorpommern": 0.06, "Niedersachsen": 0.05,
  "Nordrhein-Westfalen": 0.065, "Rheinland-Pfalz": 0.05, "Saarland": 0.065,
  "Sachsen": 0.055, "Sachsen-Anhalt": 0.05, "Schleswig-Holstein": 0.065,
  "Thüringen": 0.065,
};

function Section({ title, children }) {
  return (
    <div className="bank-section" style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 6, padding: "18px 22px", pageBreakInside: "avoid" }}>
      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#2d6a2d", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14, paddingBottom: 8, borderBottom: "2px solid #e8f5e8" }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, bold, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f5f5f5", fontSize: "0.88rem", background: highlight ? "#f0faf0" : "transparent" }}>
      <span style={{ color: "#555" }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 400, color: bold ? "#1a1a1a" : "#444" }}>{value}</span>
    </div>
  );
}

export default function Bankgespraech({ result, inputs }) {
  if (!result) return <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Wird berechnet…</div>;
  const { df, s } = result;

  const gr = GREST[inputs.bl] || 0.065;
  const today = new Date().toLocaleDateString("de-DE");
  const dscr = s.wm > 0 ? s.wm / s.rm : 0; // Debt Service Coverage Ratio
  const ltv = inputs.kp > 0 ? s.dg / inputs.kp : 0;

  // Tilgungsplan for print (first 10 years)
  const tilgYears = df.slice(0, 10);

  return (
    <div>
      {/* Print button */}
      <div style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }} className="no-print">
        <button onClick={() => window.print()}
          style={{ background: "var(--green-500)", color: "#fff", border: "none", borderRadius: "var(--r-md)", padding: "10px 24px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
          🖨 Drucken / PDF speichern
        </button>
        <span style={{ fontSize: "0.8rem", color: "var(--text-3)" }}>Strg+P → "Als PDF speichern" für beste Ergebnisse</span>
      </div>

      {/* ── Print Document ── */}
      <div id="bank-doc" style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 800, fontFamily: "system-ui, sans-serif" }}>

        {/* Header */}
        <div style={{ background: "#1a2e1a", color: "#fff", borderRadius: 6, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 4 }}>Immobilien-Finanzierungsübersicht</div>
            <div style={{ fontSize: "0.85rem", color: "#b8d4b8" }}>{inputs.adr || "Objekt"} — erstellt {today}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{fe(inputs.kp)}</div>
            <div style={{ fontSize: "0.78rem", color: "#b8d4b8" }}>Kaufpreis</div>
          </div>
        </div>

        {/* Seite 1: Objekt + Finanzierungsstruktur */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Section title="1. Objektübersicht">
            <Row label="Adresse / Objekt" value={inputs.adr || "—"} />
            <Row label="Kaufpreis" value={fe(inputs.kp)} bold />
            <Row label="Wohnfläche" value={`${inputs.wfl} m²`} />
            <Row label="Preis / m²" value={fe(inputs.kp / inputs.wfl)} />
            <Row label="Bundesland" value={inputs.bl} />
            <Row label="Baujahr-Kategorie" value={inputs.bj} />
            <Row label="Kaltmiete" value={`${fe(inputs.km)}/M`} />
            <Row label="Jahresnettomiete" value={fe(inputs.km * 12)} />
            <Row label="Bruttomietrendite" value={fp(s.br)} bold />
          </Section>

          <Section title="2. Finanzierungsstruktur">
            <Row label="Kaufpreis" value={fe(inputs.kp)} />
            <Row label="Kaufnebenkosten" value={fe(s.nk)} />
            {inputs.inv > 0 && <Row label="Renovierung / Sanierung" value={fe(inputs.inv)} />}
            <Row label="Gesamtinvestition" value={fe(s.gi)} bold />
            <Row label="" value="" />
            <Row label="Eigenkapital" value={fe(s.ek)} bold highlight />
            <Row label="Darlehen I" value={fe(s.d1)} />
            {inputs.d2s > 0 && <Row label="Darlehen II (Bauspar/KfW)" value={fe(inputs.d2s)} />}
            <Row label="Gesamtdarlehen" value={fe(s.dg)} bold />
            <Row label="LTV (Beleihungsquote)" value={fp(ltv)} bold highlight />
            <Row label="Zinssatz p.a." value={fp(inputs.z1)} />
            <Row label="Tilgung p.a." value={fp(inputs.t1)} />
            <Row label="Zinsbindung" value={`${inputs.zfest ?? 10} Jahre`} />
            <Row label="Monatliche Rate" value={`${fe(s.rm)}/M`} bold />
            <Row label="DSCR (Mietdeckung)" value={dscr.toFixed(2)} bold highlight />
          </Section>
        </div>

        {/* Seite 2: Kaufnebenkosten + Cashflow */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Section title="3. Kaufnebenkosten">
            <Row label="Grunderwerbsteuer" value={`${fp(gr)} = ${fe(gr * inputs.kp)}`} />
            <Row label="Maklerkosten" value={`${fp(inputs.mk)} = ${fe(inputs.mk * inputs.kp)}`} />
            <Row label="Notar" value={`${fp(inputs.no)} = ${fe(inputs.no * inputs.kp)}`} />
            <Row label="Grundbuch" value={`${fp(inputs.gb)} = ${fe(inputs.gb * inputs.kp)}`} />
            <Row label="Gesamt NK" value={`${fp(s.nk / inputs.kp)} = ${fe(s.nk)}`} bold />
            <Row label="" value="" />
            {inputs.inv > 0 && <>
              <Row label="Renovierung / Anfangsinvestition" value={fe(inputs.inv)} />
              <Row label="Gesamter Kapitalbedarf" value={fe(s.ek)} bold highlight />
            </>}
          </Section>

          <Section title="4. Monatliche Cashflow-Rechnung (Jahr 1)">
            <Row label="Kaltmiete" value={`+ ${fe(inputs.km)}`} />
            <Row label="Nebenkosten (Grundsteuer etc.)" value={`+ ${fe(inputs.gsm)}`} />
            <Row label="Warmmiete (Einnahmen)" value={`= ${fe(s.wm)}`} bold />
            <Row label="" value="" />
            <Row label="− Hausgeld (n.u.)" value={fe(-inputs.hg)} />
            <Row label="− Instandhaltung & Erneuerung" value={fe(-s.ihm)} />
            <Row label="− Mietausfallrisiko" value={fe(-s.mam)} />
            <Row label="− Grundsteuer & NK" value={fe(-inputs.gsm)} />
            <Row label="= CF operativ" value={fe(s.cfop)} bold />
            <Row label="" value="" />
            <Row label="− Zins" value={fe(-s.zm)} />
            <Row label="− Tilgung" value={fe(-s.tm)} />
            <Row label="= CF vor Steuer" value={fe(s.cfop)} />
            <Row label="− Steuer (AfA-bereinigt)" value={fe(-s.stm)} />
            <Row label="= CF netto / Monat" value={fe(s.cfn)} bold highlight />
          </Section>
        </div>

        {/* Seite 3: Tilgungsplan (10 Jahre) */}
        <Section title="5. Tilgungsplan (Auszug 10 Jahre)">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  {["Jahr", "Jahresmiete", "Rate/M", "Zinsen/J", "Tilgung/J", "Restschuld", "Marktwert", "Eigenkapital"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: h === "Jahr" ? "left" : "right", fontSize: "0.7rem", fontWeight: 700, color: "#666", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tilgYears.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa", borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "5px 10px", fontWeight: 600 }}>{r.jr}</td>
                    <td style={{ padding: "5px 10px", textAlign: "right" }}>{fe(r.mi * 12)}</td>
                    <td style={{ padding: "5px 10px", textAlign: "right" }}>{fe(r.rm)}</td>
                    <td style={{ padding: "5px 10px", textAlign: "right" }}>{fe(r.zi)}</td>
                    <td style={{ padding: "5px 10px", textAlign: "right" }}>{fe(r.ti)}</td>
                    <td style={{ padding: "5px 10px", textAlign: "right", fontWeight: 600 }}>{fe(r.rs)}</td>
                    <td style={{ padding: "5px 10px", textAlign: "right" }}>{fe(r.w)}</td>
                    <td style={{ padding: "5px 10px", textAlign: "right", fontWeight: 600, color: "#2d6a2d" }}>{fe(r.nv)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Seite 4: Prognose */}
        <Section title="6. Vermögensprognose">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
            {[
              { label: "EK-Rendite (J1)", value: fp(s.ekr) },
              { label: "Nettomietrendite", value: fp(s.nmr) },
              { label: "CF netto / Monat", value: fe(s.cfn) },
              { label: "Tilgungsende", value: s.vtj ? String(s.vtj) : "Offen" },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "#f8faf8", border: "1px solid #e0ece0", borderRadius: 4, padding: "10px 14px" }}>
                <div style={{ fontSize: "0.68rem", color: "#777", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2d6a2d" }}>{value}</div>
              </div>
            ))}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                {["", "Jahr 10", "Jahr 20", "Jahr 30"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: h === "" ? "left" : "right", fontSize: "0.7rem", fontWeight: 700, color: "#666", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Marktwert", r => fe(r.w)],
                ["Restschuld", r => fe(r.rs)],
                ["Eigenkapital Immobilie", r => fe(r.nv)],
                ["Kumulierter CF", r => fe(r.kcf)],
                ["Nettovermögen gesamt", r => fe(r.tot)],
              ].map(([label, fn]) => (
                <tr key={label} style={{ borderBottom: "1px solid #eee", background: label.startsWith("Netto") ? "#f0faf0" : "transparent" }}>
                  <td style={{ padding: "6px 10px", color: "#555", fontWeight: label.startsWith("Netto") ? 700 : 400 }}>{label}</td>
                  {[df[9], df[19], df[29]].map((r, i) => (
                    <td key={i} style={{ padding: "6px 10px", textAlign: "right", fontWeight: label.startsWith("Netto") ? 700 : 400, color: label.startsWith("Netto") ? "#2d6a2d" : "#333" }}>
                      {r ? fn(r) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Footer */}
        <div style={{ fontSize: "0.72rem", color: "var(--text-3)", textAlign: "center", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          ⚠️ Kein Ersatz für Finanz-, Steuer- oder Rechtsberatung. Alle Angaben ohne Gewähr.
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          #bank-doc { max-width: 100%; }
          .bank-section { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

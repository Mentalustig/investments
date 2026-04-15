import { fe, fp } from "../../fmt.js";

function RiskMeter({ value, max, label, green, amber }) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  const col = value >= green ? "#2d6a2d" : value >= amber ? "#8a6200" : "#c0392b";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "0.78rem" }}>
        <span style={{ color: "var(--text-2)" }}>{label}</span>
        <span style={{ fontWeight: 700, color: col }}>{value >= 0 ? "+" : ""}{typeof value === "number" && Math.abs(value) < 1 ? fp(value) : fe(value)}</span>
      </div>
      <div style={{ height: 8, background: "var(--bg-subtle)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct * 100}%`, background: col, borderRadius: 4, transition: "width 300ms" }} />
      </div>
    </div>
  );
}

function StressCard({ title, scenario, cfn, delta, color }) {
  return (
    <div style={{ background: color === "red" ? "#fff0f0" : color === "amber" ? "#fffbf0" : "#f0faf0", border: `1px solid ${color === "red" ? "#f0b8b8" : color === "amber" ? "#f0d080" : "#b8ddb8"}`, borderRadius: "var(--r-md)", padding: "16px 18px" }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: "0.83rem", color: "var(--text-2)", marginBottom: 10 }}>{scenario}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: color === "red" ? "#c0392b" : color === "amber" ? "#8a6200" : "#2d6a2d" }}>{fe(cfn)}/M</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>CF netto</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1rem", fontWeight: 600, color: delta <= 0 ? "#c0392b" : "#2d6a2d" }}>{delta >= 0 ? "+" : ""}{fe(delta)}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>vs. Basis</div>
        </div>
      </div>
    </div>
  );
}

export default function Risiko({ result, inputs, beKm, beZ1 }) {
  if (!result) return <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Wird berechnet…</div>;
  const { s } = result;

  const pufferKm = beKm != null && inputs.km > 0 ? inputs.km - beKm : null;
  const pufferKmPct = pufferKm != null ? pufferKm / inputs.km : null;
  const pufferZ1 = beZ1 != null ? beZ1 - inputs.z1 : null;

  // Stress scenarios (approximate, calculated from base CF)
  const stressScenarios = [
    {
      title: "3 Monate Leerstand",
      scenario: "Mieter kündigt, 3 Monate keine Einnahmen",
      cfn: s.cfn - inputs.km * 3 / 12,
      delta: -inputs.km * 3 / 12,
    },
    {
      title: "Zinsanstieg +2%",
      scenario: `Anschlussfinanzierung bei ${fp(inputs.z1 + 0.02)} statt ${fp(inputs.z1)}`,
      cfn: s.cfn - (inputs.d1p * inputs.kp * 0.02) / 12,
      delta: -(inputs.d1p * inputs.kp * 0.02) / 12,
    },
    {
      title: "Miete −20%",
      scenario: "Neue Marktmiete 20% unter Erwartung",
      cfn: s.cfn - inputs.km * 0.2 * (1 - s.gst),
      delta: -inputs.km * 0.2 * (1 - s.gst),
    },
    {
      title: "Sanierung ungeplant",
      scenario: "Dach / Heizung: einmalig 25.000 € in Jahr 5",
      cfn: s.cfn - 25000 / (5 * 12),
      delta: -25000 / (5 * 12),
    },
    {
      title: "Kombination (schlimmster Fall)",
      scenario: "Leerstand + Zins +1% + Miete −10%",
      cfn: s.cfn - inputs.km / 12 * 2 - (inputs.d1p * inputs.kp * 0.01) / 12 - inputs.km * 0.1 * (1 - s.gst),
      delta: -(inputs.km / 12 * 2 + (inputs.d1p * inputs.kp * 0.01) / 12 + inputs.km * 0.1 * (1 - s.gst)),
    },
    {
      title: "Best Case",
      scenario: "Miete +15% + Wertstg. 4%/J + kein Leerstand",
      cfn: s.cfn + inputs.km * 0.15 * (1 - s.gst),
      delta: inputs.km * 0.15 * (1 - s.gst),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Breakeven ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "18px 20px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 12 }}>Breakeven Kaltmiete</div>
          {[
            ["Deine Miete", fe(inputs.km) + "/M"],
            ["Breakeven-Miete", beKm != null ? fe(beKm) + "/M" : "Berechne…"],
            ["Puffer absolut", pufferKm != null ? fe(pufferKm) + "/M" : "—"],
            ["Puffer relativ", pufferKmPct != null ? fp(pufferKmPct) : "—"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--bg-subtle)", fontSize: "0.87rem" }}>
              <span style={{ color: "var(--text-2)" }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          {pufferKmPct != null && (
            <div style={{ marginTop: 10 }}>
              <RiskMeter value={pufferKmPct} max={0.4} label="Sicherheitspuffer Miete" green={0.15} amber={0.05} />
            </div>
          )}
          <div style={{ fontSize: "0.72rem", color: "var(--text-3)", marginTop: 8 }}>Unter Breakeven: Objekt kostet monatlich Geld aus eigener Tasche.</div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "18px 20px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 12 }}>Breakeven Zinssatz</div>
          {[
            ["Dein Zinssatz", fp(inputs.z1)],
            ["Max. tragbarer Zins", beZ1 != null ? fp(beZ1) : "Berechne…"],
            ["Puffer absolut", pufferZ1 != null ? fp(pufferZ1) + " pp" : "—"],
            ["Anschlusszins", fp(inputs.zans ?? inputs.z1)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--bg-subtle)", fontSize: "0.87rem" }}>
              <span style={{ color: "var(--text-2)" }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          {pufferZ1 != null && (
            <div style={{ marginTop: 10 }}>
              <RiskMeter value={pufferZ1} max={0.06} label="Zinspuffer" green={0.02} amber={0.01} />
            </div>
          )}
          <div style={{ fontSize: "0.72rem", color: "var(--text-3)", marginTop: 8 }}>Bei Anschlussfinanzierung: Zinsen können um diesen Betrag steigen, bevor der CF negativ wird.</div>
        </div>
      </div>

      {/* ── Stress Szenarien ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "18px 20px", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 4 }}>Stress-Szenarien</div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-3)", marginBottom: 14 }}>Basis CF: {fe(s.cfn)}/M — Was passiert wenn…?</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {stressScenarios.map((sc, i) => (
            <StressCard key={i} {...sc} color={sc.cfn >= 0 ? "green" : sc.cfn >= -300 ? "amber" : "red"} />
          ))}
        </div>
        <div style={{ fontSize: "0.68rem", color: "var(--text-3)", marginTop: 10 }}>* Näherungswerte ohne vollständige Neuberechnung. Für exakte Werte: Eingaben anpassen.</div>
      </div>

      {/* ── Risikofaktoren ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "18px 20px", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 12 }}>Risikoprofil</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {pufferKmPct != null && <RiskMeter value={Math.max(pufferKmPct, 0)} max={0.4} label={`Mietpuffer: ${fp(Math.max(pufferKmPct, 0))}`} green={0.15} amber={0.05} />}
          {pufferZ1 != null && <RiskMeter value={Math.max(pufferZ1, 0)} max={0.05} label={`Zinspuffer: ${fp(Math.max(pufferZ1, 0))} pp`} green={0.02} amber={0.01} />}
          <RiskMeter value={Math.max(1 - s.dg / inputs.kp, 0)} max={1} label={`Eigenkapitalquote: ${fp(Math.max(1 - s.dg / inputs.kp, 0))} (LTV ${fp(s.dg / inputs.kp)})`} green={0.3} amber={0.2} />
          <RiskMeter value={Math.min(inputs.ihq / 12, 1)} max={1} label={`IH-Rücklage: ${inputs.ihq} €/m²/J (Standard 8–12)`} green={0.67} amber={0.5} />
        </div>
      </div>
    </div>
  );
}

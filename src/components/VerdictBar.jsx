import { fe, fp } from "../fmt.js";

function KpiTile({ label, value, sub, context, color, loading }) {
  const colors = {
    green:  { bg: "#f0faf0", border: "#b8ddb8", val: "#2d6a2d" },
    amber:  { bg: "#fffbf0", border: "#f0d080", val: "#8a6200" },
    red:    { bg: "#fff0f0", border: "#f0b8b8", val: "#c0392b" },
    neutral:{ bg: "var(--surface)", border: "var(--border)", val: "var(--text-1)" },
  };
  const c = colors[color] || colors.neutral;

  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: "var(--r-md)", padding: "12px 18px", flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: loading ? "1rem" : "1.6rem", fontWeight: 800, color: loading ? "var(--text-3)" : c.val, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
        {loading ? "…" : value}
      </div>
      {sub && <div style={{ fontSize: "0.75rem", color: "var(--text-2)", marginTop: 3 }}>{sub}</div>}
      {context && <div style={{ fontSize: "0.68rem", color: "var(--text-3)", marginTop: 2 }}>{context}</div>}
    </div>
  );
}

export default function VerdictBar({ result, inputs, beKm, beZ1, loading }) {
  if (!result && !loading) return null;

  const s = result?.s;

  // 1. Cashflow netto
  const cfn = s?.cfn ?? 0;
  const cfColor = cfn >= 0 ? "green" : cfn >= -200 ? "amber" : "red";

  // 2. Nettomietrendite = (Warmmiete - Bewirtschaftung) * 12 / Gesamtinvestition
  const nmr = s?.nmr ?? 0;
  const nmrColor = nmr >= 0.04 ? "green" : nmr >= 0.03 ? "amber" : "red";

  // 3. EK-Rendite
  const ekr = s?.ekr ?? 0;
  const ekrColor = ekr >= 0.08 ? "green" : ekr >= 0.05 ? "amber" : "red";

  // 4. Breakeven-Puffer
  const pufferKm = beKm != null && inputs.km > 0 ? (inputs.km - beKm) / inputs.km : null;
  const pufferZ1 = beZ1 != null ? beZ1 - inputs.z1 : null;
  const riskColor = pufferKm == null ? "neutral" : pufferKm > 0.15 ? "green" : pufferKm > 0.05 ? "amber" : "red";
  const riskValue = pufferKm != null ? `${fp(pufferKm)} Mietpuffer` : "—";
  const riskSub = pufferZ1 != null ? `Zins kann +${fp(pufferZ1)} steigen` : "";

  return (
    <div style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)", padding: "12px 24px", display: "flex", gap: 12, flexShrink: 0 }}>
      <KpiTile
        label="Cashflow netto / Monat"
        value={loading ? null : fe(cfn)}
        sub={s ? `operativ: ${fe(s.cfop)}/M` : null}
        context="nach Steuern & allen Kosten"
        color={loading ? "neutral" : cfColor}
        loading={loading}
      />
      <KpiTile
        label="Nettomietrendite"
        value={loading ? null : fp(nmr)}
        sub={s ? `Brutto: ${fp(s.br)}` : null}
        context="Ziel: ≥ 4%"
        color={loading ? "neutral" : nmrColor}
        loading={loading}
      />
      <KpiTile
        label="EK-Rendite (Jahr 1)"
        value={loading ? null : fp(ekr)}
        sub={s ? `EK eingesetzt: ${(s.ek / 1000).toFixed(0)}k €` : null}
        context="inkl. Tilgung + Wertstg."
        color={loading ? "neutral" : ekrColor}
        loading={loading}
      />
      <KpiTile
        label="Risikopuffer"
        value={loading ? null : riskValue}
        sub={loading ? null : riskSub}
        context={beKm != null ? `Breakeven-Miete: ${fe(beKm)}/M` : "Wird berechnet…"}
        color={loading ? "neutral" : riskColor}
        loading={loading}
      />
    </div>
  );
}

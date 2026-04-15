import { fe, fp } from "../fmt.js";

const TILE_CONFIGS = {
  green:   { bg: "var(--positive-bg)",  border: "var(--positive-border)",  val: "var(--positive)" },
  amber:   { bg: "var(--warning-bg)",   border: "var(--warning-border)",   val: "var(--warning)" },
  red:     { bg: "var(--negative-bg)",  border: "var(--negative-border)",  val: "var(--negative)" },
  neutral: { bg: "var(--surface)",      border: "var(--border)",           val: "var(--text-1)" },
};

function Tile({ label, value, sub, hint, color = "neutral", loading }) {
  const c = TILE_CONFIGS[color];
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: "var(--r-md)", padding: "14px 20px",
      flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: loading ? "0.9rem" : "1.7rem", fontWeight: 800, color: loading ? "var(--text-3)" : c.val, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
        {loading ? "Berechnet…" : value}
      </div>
      {!loading && sub && (
        <div style={{ fontSize: "0.75rem", color: "var(--text-2)", marginTop: 5, fontWeight: 500 }}>{sub}</div>
      )}
      {!loading && hint && (
        <div style={{ fontSize: "0.67rem", color: "var(--text-3)", marginTop: 3 }}>{hint}</div>
      )}
    </div>
  );
}

export default function VerdictBar({ result, inputs, beKm, beZ1, loading }) {
  if (!result && !loading) return null;
  const s = result?.s;

  const cfn = s?.cfn ?? 0;
  const cfColor = cfn >= 0 ? "green" : cfn >= -200 ? "amber" : "red";

  const nmr = s?.nmr ?? 0;
  const nmrColor = nmr >= 0.04 ? "green" : nmr >= 0.03 ? "amber" : "red";

  const ekr = s?.ekr ?? 0;
  const ekrColor = ekr >= 0.08 ? "green" : ekr >= 0.05 ? "amber" : "red";

  const pufferKmPct = beKm != null && inputs.km > 0 ? (inputs.km - beKm) / inputs.km : null;
  const pufferZ1 = beZ1 != null ? beZ1 - inputs.z1 : null;
  const riskColor = pufferKmPct == null ? "neutral" : pufferKmPct > 0.15 ? "green" : pufferKmPct > 0.05 ? "amber" : "red";

  return (
    <div style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)", padding: "12px 24px", display: "flex", gap: 10, flexShrink: 0 }}>
      <Tile
        label="Cashflow netto / Monat"
        value={fe(cfn)}
        sub={s ? `Operativ: ${fe(s.cfop)} · Steuerlast: ${fe(-s.stm)}` : null}
        hint="nach allen Kosten & Steuern"
        color={loading ? "neutral" : cfColor}
        loading={loading}
      />
      <Tile
        label="Nettomietrendite"
        value={fp(nmr)}
        sub={s ? `Bruttorendite: ${fp(s.br)}` : null}
        hint="Ziel: ≥ 4 %"
        color={loading ? "neutral" : nmrColor}
        loading={loading}
      />
      <Tile
        label="EK-Rendite (Jahr 1)"
        value={fp(ekr)}
        sub={s ? `EK: ${(s.ek / 1000).toFixed(0)} k€ · LTV: ${fp(s.dg / inputs.kp)}` : null}
        hint="inkl. Tilgung + Wertsteigerung"
        color={loading ? "neutral" : ekrColor}
        loading={loading}
      />
      <Tile
        label="Risikopuffer"
        value={pufferKmPct != null ? fp(pufferKmPct) + " Mietpuffer" : "—"}
        sub={pufferZ1 != null ? `Zins kann +${fp(pufferZ1)} steigen` : null}
        hint={beKm != null ? `Breakeven-Miete: ${fe(beKm)}/M` : "Wird berechnet…"}
        color={loading ? "neutral" : riskColor}
        loading={loading}
      />
    </div>
  );
}

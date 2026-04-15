import { fe, fp, color } from "../../fmt.js";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend } from "recharts";

// Simple SVG waterfall chart
function WaterfallChart({ items }) {
  const W = 560, H = 200, PAD = { l: 10, r: 10, t: 20, b: 40 };
  const inner = { w: W - PAD.l - PAD.r, h: H - PAD.t - PAD.b };

  const absMax = Math.max(...items.map(it => Math.abs(it.value)), 1);
  const scale = (inner.h * 0.45) / absMax;

  const barW = Math.floor(inner.w / items.length) - 4;
  const mid = PAD.t + inner.h / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, display: "block" }}>
      {/* Zero line */}
      <line x1={PAD.l} x2={W - PAD.r} y1={mid} y2={mid} stroke="var(--border)" strokeWidth={1} />

      {items.map((it, i) => {
        const x = PAD.l + i * (barW + 4) + 2;
        const h = Math.abs(it.value) * scale;
        const y = it.value >= 0 ? mid - h : mid;
        const fill = it.isResult ? (it.value >= 0 ? "#2d6a2d" : "#c0392b") : (it.value >= 0 ? "#4a9a4a" : "#e07070");

        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(h, 1)} fill={fill} rx={2} />
            {/* Label above/below */}
            <text x={x + barW / 2} y={it.value >= 0 ? y - 4 : y + h + 12} textAnchor="middle"
              fontSize={10} fill="var(--text-2)" fontWeight={it.isResult ? 700 : 400}>
              {it.value >= 0 ? "+" : ""}{it.value >= 1000 || it.value <= -1000 ? `${(it.value / 1000).toFixed(1)}k` : Math.round(it.value)}
            </text>
            {/* X label */}
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={9} fill="var(--text-3)">{it.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

const customTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--dark)", border: "none", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#fff" }}>
      <div style={{ marginBottom: 4, fontWeight: 600 }}>Jahr {label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {fe(p.value)}
        </div>
      ))}
    </div>
  );
};

export default function Cashflow({ result, inputs }) {
  if (!result) return <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Wird berechnet…</div>;
  const { df, s } = result;

  // Waterfall items (monthly €)
  const waterfallItems = [
    { label: "Kaltmiete", value: s.wm - inputs.gsm },
    { label: "+ NK", value: inputs.gsm },
    { label: "− Grundsteuer", value: -inputs.gsm },
    { label: "− Hausgeld", value: -inputs.hg },
    { label: "− Instandhalt.", value: -s.ihm },
    { label: "− Mietausfall", value: -s.mam },
    { label: "= CF operativ", value: s.cfop, isResult: true },
    { label: "− Zinsen", value: -s.zm },
    { label: "− Tilgung", value: -s.tm },
    { label: "− Steuern", value: -s.stm },
    { label: "= CF netto", value: s.cfn, isResult: true },
  ];

  // Timeline data: CF per year over 30 years
  const timelineData = df.slice(0, 30).map(r => ({
    year: r.jr,
    "CF netto": Math.round(r.cn),
    "CF operativ": Math.round(r.co),
    refi: r.refi,
  }));

  const zfest = inputs.zfest ?? 10;
  const refiYear = 2026 + zfest;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Headline ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        {[
          { label: "CF netto / Monat (Jahr 1)", value: fe(s.cfn), col: color(s.cfn) },
          { label: "CF operativ / Monat", value: fe(s.cfop), col: color(s.cfop) },
          { label: "Steuerbelastung / Monat", value: fe(-s.stm), col: s.stm > 0 ? "var(--negative)" : "var(--positive)" },
        ].map(({ label, value, col }) => (
          <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px 20px", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: col, fontVariantNumeric: "tabular-nums" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Waterfall ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "18px 20px", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 4 }}>Cashflow-Wasserfall (Jahr 1, monatlich)</div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-3)", marginBottom: 12 }}>Wie setzt sich der monatliche Cashflow zusammen?</div>
        <WaterfallChart items={waterfallItems} />
      </div>

      {/* ── Timeline ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "18px 20px", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 4 }}>Cashflow-Entwicklung über 30 Jahre</div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-3)", marginBottom: 12 }}>
          Zinsbindung endet {refiYear} → Anschlusszins {fp(inputs.zans ?? inputs.z1)} (sichtbarer Knick)
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={timelineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--text-2)" }} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-2)" }} tickFormatter={v => `${v > 0 ? "+" : ""}${Math.round(v)}€`} />
            <Tooltip content={customTooltip} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={0} stroke="var(--border)" strokeWidth={2} />
            <ReferenceLine x={refiYear} stroke="var(--text-3)" strokeDasharray="4 4" label={{ value: "Refi", position: "top", fontSize: 10, fill: "var(--text-3)" }} />
            <Line type="monotone" dataKey="CF netto" stroke="#2d6a2d" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="CF operativ" stroke="#4a9a9a" strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Annahmen ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px 20px", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 10 }}>Kern-Annahmen dieser Berechnung</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            ["Kaltmiete", `${fe(inputs.km)}/M`],
            ["Zinssatz", fp(inputs.z1)],
            ["Zinsbindung", `${inputs.zfest ?? 10} Jahre`],
            ["Anschlusszins", fp(inputs.zans ?? inputs.z1)],
            ["Mietausfall", fp(inputs.ma)],
            ["Grenzsteuersatz", fp(s.gst)],
            ["AfA/Monat", fe(s.afm)],
            ["Instandhaltung", `${inputs.ihq} €/m²/J`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--bg-subtle)", fontSize: "0.83rem" }}>
              <span style={{ color: "var(--text-2)" }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { fe, fp, colorCls, bgCls } from "../../fmt.js";
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend,
} from "recharts";

// ── Hero card ────────────────────────────────────────────────────────────────
function Hero({ value, label, sub, positive }) {
  return (
    <div className={`rounded-xl p-6 border ${positive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">{label}</p>
      <p className={`text-5xl font-extrabold tabular-nums ${positive ? "text-green-700" : "text-red-600"}`}>{value}</p>
      {sub && <p className="text-sm text-gray-500 mt-2">{sub}</p>}
    </div>
  );
}

// ── KPI pill ─────────────────────────────────────────────────────────────────
function Kpi({ label, value, sub }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Waterfall (true floating bars via SVG) ────────────────────────────────────
function Waterfall({ items }) {
  let running = 0;
  const bars = items.map(it => {
    const isPos = it.value >= 0;
    const base = it.isTotal ? 0 : running;
    const top = it.isTotal ? it.value : running + it.value;
    if (!it.isTotal) running += it.value;
    return { ...it, base: Math.min(base, top), end: Math.max(base, top), isPos };
  });

  const allVals = bars.flatMap(b => [b.base, b.end]);
  const minV = Math.min(...allVals, 0);
  const maxV = Math.max(...allVals, 0);
  const range = maxV - minV || 1;

  const W = 720, H = 240, PL = 8, PR = 8, PT = 28, PB = 48;
  const cH = H - PT - PB;
  const bW = Math.floor((W - PL - PR) / bars.length) - 4;
  const toY = v => PT + ((maxV - v) / range) * cH;
  const zeroY = toY(0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* zero line */}
      <line x1={0} x2={W} y1={zeroY} y2={zeroY} stroke="#e5e7eb" strokeWidth={1.5} />

      {bars.map((b, i) => {
        const x = PL + i * (bW + 4);
        const y1 = toY(b.end);
        const y2 = toY(b.base);
        const bH = Math.max(y2 - y1, 2);
        const fill = b.isTotal
          ? (b.isPos ? "#15803d" : "#dc2626")
          : (b.isPos ? "#4ade80" : "#fca5a5");
        const stroke = b.isTotal
          ? (b.isPos ? "#14532d" : "#991b1b")
          : (b.isPos ? "#16a34a" : "#ef4444");
        const valY = b.isPos ? y1 - 6 : y2 + 13;
        const labelColor = b.isPos ? "#15803d" : "#dc2626";

        return (
          <g key={i}>
            {/* connector */}
            {!b.isTotal && i < bars.length - 1 && (
              <line x1={x + bW} x2={x + bW + 4} y1={b.isPos ? y1 : y2} y2={b.isPos ? y1 : y2}
                stroke="#d1d5db" strokeWidth={1} strokeDasharray="2 2" />
            )}
            <rect x={x} y={y1} width={bW} height={bH} fill={fill} stroke={stroke} strokeWidth={1} rx={3} />
            <text x={x + bW / 2} y={valY} textAnchor="middle" fontSize={10} fill={labelColor} fontWeight={b.isTotal ? 700 : 500}>
              {b.value >= 0 ? "+" : ""}{Math.abs(b.value) >= 1000 ? `${(b.value / 1000).toFixed(1)}k` : Math.round(b.value)}
            </text>
            <text x={x + bW / 2} y={H - 8} textAnchor="middle" fontSize={9} fill={b.isTotal ? "#374151" : "#9ca3af"} fontWeight={b.isTotal ? 600 : 400}>
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white rounded-lg p-3 text-xs shadow-xl">
      <p className="font-bold text-gray-300 mb-2">Jahr {label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex justify-between gap-4">
          <span className="text-gray-400">{p.name}</span>
          <span className="font-semibold" style={{ color: p.color }}>{fe(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function Cashflow({ result, inputs, loading }) {
  if (loading && !result) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Wird berechnet…</div>
  );
  if (!result) return null;

  const { df, s } = result;
  const zfest = inputs.zfest ?? 10;
  const refiYear = 2026 + zfest;

  const waterfallItems = [
    { label: "Kaltmiete",    value: inputs.km },
    { label: "− Hausgeld",   value: -s.hg },
    { label: "− Instandh.",  value: -s.ihm },
    { label: "− Ausfall",    value: -s.mam },
    { label: "CF operativ",  value: s.cfop + s.zm + s.tm, isTotal: true },
    { label: "− Zinsen",     value: -s.zm },
    { label: "− Tilgung",    value: -s.tm },
    { label: "− Steuern",    value: -s.stm },
    { label: "CF netto",     value: s.cfn, isTotal: true },
  ];

  const chartData = df.slice(0, 30).map(r => ({
    year: r.jr,
    "CF netto": Math.round(r.cn),
    "CF operativ": Math.round(r.co),
  }));

  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      {/* Hero + KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <Hero
            label="Cashflow netto / Monat"
            value={fe(s.cfn)}
            sub={`nach Steuern & allen Kosten · Jahr 1`}
            positive={s.cfn >= 0}
          />
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-3">
          <Kpi label="CF operativ / Monat" value={fe(s.cfop)} sub="vor Steuer, nach Zins & Tilgung" />
          <Kpi label="Steuerlast / Monat" value={fe(-s.stm)} sub={`Grenzsteuersatz ${fp(s.gst)}`} />
          <Kpi label="Zinsen / Monat" value={fe(-s.zm)} sub={`Tilgung: ${fe(s.tm)}/M`} />
          <Kpi label="CF positiv ab" value={s.cfPositiveYear ? String(s.cfPositiveYear) : "Nie"} sub="Jahr in dem CF netto ≥ 0" />
        </div>
      </div>

      {/* Wasserfall */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-1">Cashflow-Wasserfall — Monat 1</h2>
        <p className="text-xs text-gray-400 mb-5">
          Wie entsteht der monatliche Cashflow? Grün = Einnahmen, Rot = Ausgaben, Dunkel = Ergebnis
        </p>
        <Waterfall items={waterfallItems} />
      </div>

      {/* 30J Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-1">Cashflow-Entwicklung über 30 Jahre</h2>
        <p className="text-xs text-gray-400 mb-5">
          Zinsbindung endet {refiYear} → Anschlusszins {fp(inputs.zans ?? inputs.z1)}.
          Balken = CF operativ · Linie = CF netto (nach Steuer)
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
              tickFormatter={v => `${v > 0 ? "+" : ""}${Math.round(v)}€`} width={64} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <ReferenceLine y={0} stroke="#d1d5db" strokeWidth={2} />
            <ReferenceLine x={refiYear} stroke="#f59e0b" strokeDasharray="4 3"
              label={{ value: "Refi", position: "insideTopLeft", fontSize: 10, fill: "#f59e0b", dy: -14 }} />
            <Bar dataKey="CF operativ" fill="#bbf7d0" stroke="#4ade80" strokeWidth={1} radius={[2, 2, 0, 0]} />
            <Line type="monotone" dataKey="CF netto" stroke="#15803d" strokeWidth={2.5} dot={false}
              activeDot={{ r: 5, fill: "#15803d" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Annahmen */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Kern-Annahmen</h2>
        <div className="grid grid-cols-4 gap-x-6 gap-y-2">
          {[
            ["Kaltmiete", `${fe(inputs.km)}/M`],
            inputs.marktmiete > 0 && inputs.marktmiete > inputs.km
              ? ["Marktmiete (Cap)", `${fe(inputs.marktmiete)}/M — Catchup bis ${s.mietCatchupJahr ?? "?"}`]
              : ["Mietsteigerung", fp(inputs.mst)],
            ["Zinssatz", fp(inputs.z1)],
            ["Zinsbindung", `${zfest} Jahre`],
            ["Anschlusszins", fp(inputs.zans ?? inputs.z1)],
            ["Mietausfall", fp(inputs.ma)],
            ["Grenzsteuersatz", fp(s.gst)],
            ["AfA / Monat", fe(s.afm)],
            ["Instandhaltung", `${inputs.ihq} €/m²/J`],
          ].filter(Boolean).map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-gray-100 pb-1.5 text-sm">
              <span className="text-gray-500">{k}</span>
              <span className="font-semibold tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

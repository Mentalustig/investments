import { fe, fp } from "../../fmt.js";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";

const IRR_YEARS = [3, 5, 10, 15, 20, 30, 50];

function irrColor(v) {
  if (v == null) return "text-gray-400";
  if (v >= 0.08) return "text-green-700";
  if (v >= 0.04) return "text-amber-600";
  if (v >= 0)    return "text-orange-500";
  return "text-red-600";
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

function KpiCard({ label, value, hint, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-extrabold tabular-nums ${color || "text-gray-900"}`}>{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function Rendite({ result, inputs, loading }) {
  if (loading && !result) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Wird berechnet…</div>
  );
  if (!result) return null;

  const { df, s, cumInvested } = result;

  // Chart: 50 years
  const chart50 = (cumInvested || []).slice(0, 50);
  const chart30 = chart50.slice(0, 30);
  const startYear = df[0]?.jr || 2026;
  const ticksWealth = [1, 10, 20, 30, 40, 50].filter(j => j <= chart50.length);
  const ticksCF     = [1, 5, 10, 15, 20, 25, 30].filter(j => j <= chart30.length);

  // IRR explanation: true inputs at year 3
  const row3  = df[2];
  const totalIn3 = s.ek + Math.max(0, -(df.slice(0,3).reduce((a,r)=>a+r.cn*12,0) + (row3?.cn||0)*12));

  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      {/* ── Row 1: IRR + Classic KPIs ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* IRR panel */}
        <div className="col-span-1 bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">IRR — Interner Zinsfuß</p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs mb-4 space-y-1.5">
            <p className="font-semibold text-amber-800">Was steckt im IRR?</p>
            <div className="flex justify-between text-amber-700">
              <span>− EK eingesetzt (Jahr 0)</span>
              <span className="tabular-nums font-bold">−{(s.ek/1000).toFixed(1)} k€</span>
            </div>
            <div className="flex justify-between text-amber-700">
              <span>± Jährl. CF netto</span>
              <span className="tabular-nums">{s.cfn >= 0 ? "+" : ""}{(s.cfn*12/1000).toFixed(1)} k€/J</span>
            </div>
            <div className="flex justify-between text-amber-700 border-t border-amber-200 pt-1">
              <span>+ Eigenkapital bei Verkauf</span>
              <span className="tabular-nums">{df[9] ? `${(df[9].nv/1000).toFixed(0)} k€ (J10)` : "—"}</span>
            </div>
            <p className="text-amber-600 leading-relaxed pt-0.5">
              {s.cfn < -200
                ? "Negativer IRR in frühen Jahren = laufende Zuzahlungen übersteigen das aufgebaute Eigenkapital. Ab Jahr ~10–15 dreht sich das meist."
                : "IRR = annualisierte Gesamtrendite auf dein Eigenkapital (Ein- und Auszahlungen über Zeit)."}
            </p>
          </div>

          <div className="flex flex-col gap-0.5">
            {IRR_YEARS.map(yr => {
              const v = s.irr ? s.irr[yr] : null;
              const row = df[yr - 1];
              return (
                <div key={yr} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="text-sm text-gray-600">nach {yr} Jahren</span>
                    {row && <span className="text-[11px] text-gray-400 block">EK {(row.nv/1000).toFixed(0)} k€</span>}
                  </div>
                  <span className={`text-base font-bold tabular-nums ${irrColor(v)}`}>
                    {v != null ? fp(v, 1) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">Spekulationssteuer (innerhalb 10J) ist NICHT berücksichtigt → echter IRR wäre noch niedriger.</p>
        </div>

        {/* Right column: KPI grid + wealth table */}
        <div className="col-span-2 flex flex-col gap-3">

          {/* KPI grid: classic */}
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Bruttomietrendite" value={fp(s.br)} hint="Jahresmiete / Kaufpreis"
              color={s.br >= 0.05 ? "text-green-700" : s.br >= 0.04 ? "text-amber-600" : "text-red-500"} />
            <KpiCard label="Nettomietrendite"  value={fp(s.nmr)} hint="(Miete−Kosten)×12 / Gesamtinvest."
              color={s.nmr >= 0.04 ? "text-green-700" : s.nmr >= 0.03 ? "text-amber-600" : "text-red-500"} />
            <KpiCard label="Vervielfältiger"   value={`${s.verv.toFixed(1)}x`} hint="Kaufpreis / Jahresmiete"
              color={s.verv <= 25 ? "text-green-700" : s.verv <= 33 ? "text-amber-600" : "text-red-500"} />
          </div>

          {/* KPI grid: additional */}
          <div className="grid grid-cols-4 gap-3">
            <KpiCard label="Cash-on-Cash" value={fp(s.coc)} hint="CF operativ p.a. / EK"
              color={s.coc >= 0 ? "text-green-700" : "text-red-500"} />
            <KpiCard label="Debt Yield"   value={fp(s.debtYield)} hint="NOI / Darlehen (Bankmetrik)"
              color={s.debtYield >= 0.08 ? "text-green-700" : s.debtYield >= 0.05 ? "text-amber-600" : "text-red-500"} />
            <KpiCard label="Breakeven Belegung" value={fp(s.breakevenOcc)} hint="Rate+Kosten / Kaltmiete"
              color={s.breakevenOcc <= 0.85 ? "text-green-700" : s.breakevenOcc <= 1.0 ? "text-amber-600" : "text-red-500"} />
            <KpiCard label="NOI / Jahr"   value={fe(s.noi)} hint="Miete − Betriebskosten (ohne Schulddienst)"
              color={s.noi > 0 ? "text-gray-900" : "text-red-500"} />
          </div>

          {/* Wealth table: 50 years */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Vermögen zum Zeithorizont</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2"></th>
                  {[10, 20, 30, 40, 50].map(y => <th key={y} className="text-right pb-2">Jahr {y}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Marktwert",                r => fe(r.w)],
                  ["Restschuld",               r => fe(r.rs)],
                  ["Eigenkapital (Immobilie)", r => fe(r.nv)],
                  ["Kumulierter CF",           r => fe(r.kcf)],
                  ["Nettovermögen gesamt",     r => fe(r.tot)],
                  ["ETF 7 % p.a. (nur EK)",   (_, i) => fe(s.ek * Math.pow(1.07, (i + 1) * 10))],
                ].map(([label, fn]) => (
                  <tr key={label} className="border-b border-gray-50">
                    <td className={`py-1.5 pr-2 ${label === "Nettovermögen gesamt" ? "font-bold text-gray-900" : "text-gray-500"}`}>{label}</td>
                    {[df[9], df[19], df[29], df[39], df[49]].map((r, i) => (
                      <td key={i} className={`py-1.5 text-right tabular-nums text-xs ${label === "Nettovermögen gesamt" ? "font-bold text-green-700" : ""}`}>
                        {r ? fn(r, i) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Wealth chart (50 years, fair ETF) ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-1">Vermögensentwicklung über 50 Jahre</h2>
        <p className="text-xs text-gray-400 mb-1">
          <strong>Faire ETF-Linie</strong>: investiert EK + deckt jeden Monat denselben negativen Cashflow nach — also exakt dieselbe Geldausgabe wie bei der Immobilie.
        </p>
        <p className="text-xs text-gray-400 mb-5">
          Initialer EK-Einsatz: {(s.ek/1000).toFixed(0)} k€ · {s.cfn < 0 ? `Monatliche Zuzahlung: ${fe(Math.abs(s.cfn))}/M` : `Monatlicher Überschuss: ${fe(s.cfn)}/M`}
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chart50} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="j" ticks={ticksWealth} tickFormatter={v => `J${v}`}
              tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={52} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <ReferenceLine y={0} stroke="#e5e7eb" strokeWidth={1} />
            <Line type="monotone" dataKey="vermoegen"  name="Nettovermögen Immobilie" stroke="#15803d" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="etfFair7"   name="ETF 7 % p.a. (fair, gleiche Ausgaben)" stroke="#2563eb" strokeWidth={2} dot={false} strokeDasharray="6 3" />
            <Line type="monotone" dataKey="etf7"       name="ETF 7 % p.a. (nur EK)" stroke="#93c5fd" strokeWidth={1.5} dot={false} strokeDasharray="3 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Kumulierter Cashflow ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-1">Kumulierter Cashflow netto über 30 Jahre</h2>
        <p className="text-xs text-gray-400 mb-5">Summe aller jährlichen CF netto. Negativ = bisher mehr eingezahlt als erhalten.</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chart30} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="j" ticks={ticksCF} tickFormatter={v => `J${v}`}
              tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={52} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <ReferenceLine y={0} stroke="#d1d5db" strokeWidth={1.5} label={{ value: "Breakeven", position: "insideTopLeft", fontSize: 10, fill: "#9ca3af" }} />
            <Line type="monotone" dataKey="kcf" name="Kumulierter CF netto" stroke="#15803d" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

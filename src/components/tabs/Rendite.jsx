import { fe, fp } from "../../fmt.js";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";

const IRR_YEARS = [3, 5, 10, 15, 20, 30, 50];

function irrColor(v) {
  if (v == null) return "text-gray-400";
  if (v >= 0.08) return "text-green-700";
  if (v >= 0.05) return "text-amber-600";
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

export default function Rendite({ result, inputs, loading }) {
  if (loading && !result) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Wird berechnet…</div>
  );
  if (!result) return null;

  const { df, s, cumInvested } = result;

  // Chart data: 30 years — cumulative CF can go negative
  const chartData = (cumInvested || []).slice(0, 30).map(d => ({
    ...d,
    cumCF: d.rueckfluss - (d.eingezahlt - (s.ek || 0)),
  }));

  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      {/* IRR + Kennzahlen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">IRR — Interner Zinsfuß</p>
          <p className="text-xs text-gray-400 mb-4">EK-Rendite inkl. Cashflows + Verkauf am Ende</p>
          <div className="flex flex-col gap-1">
            {IRR_YEARS.map(yr => {
              const v = s.irr ? s.irr[yr] : null;
              return (
                <div key={yr} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600">nach {yr} Jahren</span>
                  <span className={`text-base font-bold tabular-nums ${irrColor(v)}`}>
                    {v != null ? fp(v, 1) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-4">Annahme: Verkauf zum Marktwert am jeweiligen Zeithorizont</p>
        </div>

        <div className="col-span-2 flex flex-col gap-3">
          {/* Klassische Kennzahlen */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Bruttomietrendite", value: fp(s.br),              hint: "Jahresmiete / Kaufpreis" },
              { label: "Nettomietrendite",  value: fp(s.nmr),             hint: "(Miete−Kosten)×12 / Gesamtinvest." },
              { label: "Vervielfältiger",   value: `${s.verv.toFixed(1)}x`, hint: "Kaufpreis / Jahresmiete" },
            ].map(({ label, value, hint }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
                <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{hint}</p>
              </div>
            ))}
          </div>

          {/* Vermögensübersicht */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Vermögen zum Zeithorizont</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2"></th>
                  {[10, 20, 30].map(y => <th key={y} className="text-right pb-2">Jahr {y}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Marktwert",                r => fe(r.w)],
                  ["Restschuld",               r => fe(r.rs)],
                  ["Eigenkapital (Immobilie)", r => fe(r.nv)],
                  ["Kumulierter CF",           r => fe(r.kcf)],
                  ["Nettovermögen gesamt",     r => fe(r.tot)],
                  ["ETF 7 % p.a.",             (_, i) => fe(s.ek * Math.pow(1.07, (i + 1) * 10))],
                ].map(([label, fn]) => (
                  <tr key={label} className="border-b border-gray-50">
                    <td className={`py-1.5 ${label === "Nettovermögen gesamt" ? "font-bold text-gray-900" : "text-gray-500"}`}>{label}</td>
                    {[df[9], df[19], df[29]].map((r, i) => (
                      <td key={i} className={`py-1.5 text-right tabular-nums ${label === "Nettovermögen gesamt" ? "font-bold text-green-700" : ""}`}>
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

      {/* Chart: Vermögensentwicklung */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-1">Vermögensentwicklung über 30 Jahre</h2>
        <p className="text-xs text-gray-400 mb-5">
          Nettovermögen Immobilie vs. ETF mit gleichem Eigenkapitaleinsatz ({(s.ek / 1000).toFixed(0)} k€)
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={52} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <ReferenceLine y={0} stroke="#e5e7eb" strokeWidth={1} />
            <Line type="monotone" dataKey="vermoegen" name="Nettovermögen Immobilie" stroke="#15803d" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="etf7" name="ETF 7 % p.a." stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="6 3" />
            <Line type="monotone" dataKey="etf5" name="ETF 5 % p.a." stroke="#93c5fd" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart: Kumulierter Cashflow */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-1">Kumulierter Cashflow über 30 Jahre</h2>
        <p className="text-xs text-gray-400 mb-5">Summe aller Netto-Cashflows — negativ = Zuzahlung nötig, positiv = läuft sich selbst</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={52} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <ReferenceLine y={0} stroke="#d1d5db" strokeWidth={1.5} />
            <Line type="monotone" dataKey="kcf" name="Kumulierter CF (netto)" stroke="#15803d" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

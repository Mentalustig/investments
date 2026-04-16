import { useState, useEffect, useCallback } from "react";
import { fe, fp } from "../../fmt.js";

// ── colour helper for CF values ───────────────────────────────────────────────
function cellCls(v, isCenter) {
  if (isCenter) return "bg-gray-900 text-white font-bold";
  if (v == null) return "bg-gray-100 text-gray-400";
  if (v >= 200)  return "bg-green-600 text-white";
  if (v >= 0)    return "bg-green-100 text-green-800";
  if (v >= -150) return "bg-amber-100 text-amber-800";
  if (v >= -300) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-700";
}

async function fetchCalc(action, params) {
  const r = await fetch("/api/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ── Tornado: single-variable sensitivity ─────────────────────────────────────
function Tornado({ base, inputs }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!base) return;
    setLoading(true);
    const cfBase = base.s.cfn;
    const vars = [
      { label: "Kaltmiete",        key: "km",   lo: inputs.km * 0.80, hi: inputs.km * 1.20, loLabel: "−20 %", hiLabel: "+20 %" },
      { label: "Zinssatz",         key: "z1",   lo: inputs.z1 - 0.02, hi: inputs.z1 + 0.02, loLabel: "−2 pp", hiLabel: "+2 pp" },
      { label: "Kaufpreis",        key: "kp",   lo: inputs.kp * 0.90, hi: inputs.kp * 1.10, loLabel: "−10 %", hiLabel: "+10 %" },
      { label: "Tilgung",          key: "t1",   lo: Math.max(0.005, inputs.t1 - 0.01), hi: inputs.t1 + 0.01, loLabel: "−1 pp", hiLabel: "+1 pp" },
      { label: "Mietausfall",      key: "ma",   lo: 0,                 hi: 0.10,             loLabel: "0 %",   hiLabel: "10 %" },
      { label: "Instandhaltung",   key: "ihq",  lo: 5,                 hi: 15,               loLabel: "5 €/m²", hiLabel: "15 €/m²" },
      { label: "Mietsteigerung",   key: "mst",  lo: 0,                 hi: 0.03,             loLabel: "0 %",   hiLabel: "3 %" },
    ];
    Promise.all(
      vars.flatMap(v => [
        fetchCalc("calculate", { ...inputs, [v.key]: v.lo }).then(r => ({ ...v, side: "lo", cf: r.s.cfn })),
        fetchCalc("calculate", { ...inputs, [v.key]: v.hi }).then(r => ({ ...v, side: "hi", cf: r.s.cfn })),
      ])
    ).then(results => {
      const merged = vars.map(v => {
        const lo = results.find(r => r.label === v.label && r.side === "lo");
        const hi = results.find(r => r.label === v.label && r.side === "hi");
        const range = Math.abs((hi?.cf ?? cfBase) - (lo?.cf ?? cfBase));
        return { ...v, cfLo: lo?.cf ?? cfBase, cfHi: hi?.cf ?? cfBase, range };
      }).sort((a, b) => b.range - a.range);
      setRows(merged);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [inputs, base]);

  if (loading) return <div className="text-xs text-gray-400 py-4">Berechnet…</div>;

  const maxRange = Math.max(...rows.map(r => r.range), 1);

  return (
    <div className="flex flex-col gap-2">
      {rows.map(r => {
        const posLo = r.cfLo < r.cfHi;
        const barLo = Math.abs(r.cfLo - base.s.cfn) / maxRange;
        const barHi = Math.abs(r.cfHi - base.s.cfn) / maxRange;
        return (
          <div key={r.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="w-36 text-gray-600 font-medium">{r.label}</span>
              <span className={`w-20 text-right tabular-nums text-xs ${r.cfLo >= 0 ? "text-green-700" : "text-red-500"}`}>{fe(r.cfLo)}/M</span>
              <span className="flex-1 mx-2 h-4 relative bg-gray-100 rounded">
                {/* left bar */}
                <span className={`absolute top-0 h-full rounded-l ${r.cfLo < base.s.cfn ? "bg-red-300" : "bg-green-300"}`}
                  style={{ right: "50%", width: `${barLo * 50}%` }} />
                {/* right bar */}
                <span className={`absolute top-0 h-full rounded-r ${r.cfHi > base.s.cfn ? "bg-green-400" : "bg-red-300"}`}
                  style={{ left: "50%", width: `${barHi * 50}%` }} />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-px h-full bg-gray-400" />
                </span>
              </span>
              <span className={`w-20 text-left tabular-nums text-xs ${r.cfHi >= 0 ? "text-green-700" : "text-red-500"}`}>{fe(r.cfHi)}/M</span>
              <div className="w-28 text-right">
                <span className="text-gray-400 text-xs">{r.loLabel} → {r.hiLabel}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 2D Grid ───────────────────────────────────────────────────────────────────
function Grid2D({ inputs }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCalc("sensitivity_2d", inputs)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [inputs]);

  if (loading) return <div className="text-xs text-gray-400 py-4">Berechnet…</div>;
  if (!data) return null;

  const { z1Steps, kmSteps, cfMatrix, currentZ1, currentKm } = data;

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="px-2 py-1 text-gray-400 text-right border border-gray-200 bg-gray-50">Zins ↓ / Miete →</th>
            {kmSteps.map(km => (
              <th key={km} className={`px-2 py-1 text-right border border-gray-200 ${Math.abs(km - currentKm) < 1 ? "bg-gray-800 text-white" : "bg-gray-50 text-gray-500"}`}>
                {Math.round(km)} €
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {z1Steps.map((z, zi) => (
            <tr key={zi}>
              <td className={`px-2 py-1 text-right border border-gray-200 font-semibold ${Math.abs(z - currentZ1) < 0.0001 ? "bg-gray-800 text-white" : "bg-gray-50 text-gray-500"}`}>
                {fp(z, 2)}
              </td>
              {kmSteps.map((km, ki) => {
                const v = cfMatrix[zi]?.[ki];
                const isCenter = Math.abs(z - currentZ1) < 0.0001 && Math.abs(km - currentKm) < 1;
                return (
                  <td key={ki} className={`px-2 py-1 text-right tabular-nums border border-gray-200 ${cellCls(v, isCenter)}`}>
                    {v != null ? `${Math.round(v)} €` : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-2">Werte = CF netto / Monat. Schwarz = aktuelle Eingabe.</p>
    </div>
  );
}

// ── IRR Sensitivity ───────────────────────────────────────────────────────────
function IrrSens({ base, inputs }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!base) return;
    setLoading(true);
    const wstVals = [0, 0.01, 0.02, 0.03, 0.04, 0.05];
    Promise.all(wstVals.map(wst =>
      fetchCalc("calculate", { ...inputs, wst }).then(r => ({ wst, irr: r.s.irr }))
    )).then(results => { setRows(results); setLoading(false); })
      .catch(() => setLoading(false));
  }, [inputs, base]);

  if (loading) return <div className="text-xs text-gray-400 py-4">Berechnet…</div>;

  return (
    <div className="overflow-x-auto">
      <table className="text-xs w-full">
        <thead>
          <tr className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
            <th className="px-3 py-2 text-left">Wertsteigerung p.a.</th>
            {[5, 10, 15, 20, 30].map(y => <th key={y} className="px-3 py-2 text-right">IRR {y}J</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ wst, irr }) => {
            const isCurrent = Math.abs(wst - inputs.wst) < 0.001;
            return (
              <tr key={wst} className={`border-b border-gray-100 ${isCurrent ? "bg-green-50 font-bold" : ""}`}>
                <td className="px-3 py-1.5">{fp(wst)} {isCurrent ? "(aktuell)" : ""}</td>
                {[5, 10, 15, 20, 30].map(y => {
                  const v = irr?.[y];
                  return (
                    <td key={y} className={`px-3 py-1.5 text-right tabular-nums font-semibold ${v == null ? "text-gray-400" : v >= 0.08 ? "text-green-700" : v >= 0.04 ? "text-amber-600" : "text-red-500"}`}>
                      {v != null ? fp(v, 1) : "—"}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-2">Fett = aktuelle Wertsteigerungs-Annahme</p>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Sensitivitaet({ result, inputs, loading }) {
  if (loading && !result) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Wird berechnet…</div>;
  if (!result) return null;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      {/* Tornado */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-1">Was bewegt den Cashflow am stärksten?</h2>
        <p className="text-xs text-gray-400 mb-5">Einfluss je Variable auf CF netto / Monat — links = niedriger Wert, rechts = hoher Wert</p>
        <Tornado base={result} inputs={inputs} />
      </div>

      {/* 2D Grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-1">CF netto: Zinssatz × Kaltmiete</h2>
        <p className="text-xs text-gray-400 mb-4">Was passiert wenn Zinsen steigen oder Miete sinkt?</p>
        <Grid2D inputs={inputs} />
      </div>

      {/* IRR vs Wertsteigerung */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-1">IRR bei verschiedenen Wertsteigerungs-Szenarien</h2>
        <p className="text-xs text-gray-400 mb-4">Wie abhängig ist der IRR von der Immobilien-Wertsteigerung?</p>
        <IrrSens base={result} inputs={inputs} />
      </div>
    </div>
  );
}

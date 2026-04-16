import { useState } from "react";
import { fe, fp } from "../../fmt.js";

// ── Market reference data (2024, empirica / Mietspiegel) ─────────────────────
// tiers: [einfach, mittel, gut, sehr gut]
const MARKT = [
  { keys: ["münchen","munich"],       mieteQm: [16,21,27,35], preisQm: [7500,10000,13000,18000] },
  { keys: ["berlin"],                 mieteQm: [9,13,17,22],  preisQm: [4000, 5500, 7500,11000] },
  { keys: ["hamburg"],                mieteQm: [11,15,19,25], preisQm: [4800, 6500, 9000,13000] },
  { keys: ["frankfurt"],              mieteQm: [11,16,21,27], preisQm: [4800, 6500, 8500,12000] },
  { keys: ["stuttgart"],              mieteQm: [11,15,20,26], preisQm: [4800, 6500, 8500,12000] },
  { keys: ["düsseldorf","dusseldorf"],mieteQm: [10,13,17,22], preisQm: [3800, 5000, 6500, 9000] },
  { keys: ["köln","koeln"],           mieteQm: [10,13,17,22], preisQm: [3800, 5000, 6500, 8500] },
  { keys: ["nürnberg","nuernberg"],   mieteQm: [8,11,14,18],  preisQm: [3200, 4500, 5800, 7500] },
  { keys: ["bonn"],                   mieteQm: [9,12,15,19],  preisQm: [3500, 4500, 6000, 8000] },
  { keys: ["freiburg"],               mieteQm: [11,14,18,23], preisQm: [4500, 6000, 7500,10000] },
  { keys: ["heidelberg"],             mieteQm: [10,13,17,22], preisQm: [4500, 6000, 7500, 9500] },
  { keys: ["regensburg"],             mieteQm: [9,12,16,21],  preisQm: [4000, 5500, 7000, 9000] },
  { keys: ["augsburg"],               mieteQm: [9,12,15,19],  preisQm: [4000, 5500, 7000, 9000] },
  { keys: ["ingolstadt"],             mieteQm: [9,12,15,20],  preisQm: [3800, 5200, 6500, 8500] },
  { keys: ["mainz","wiesbaden"],      mieteQm: [10,13,17,21], preisQm: [4000, 5500, 7000, 9500] },
  { keys: ["karlsruhe"],              mieteQm: [8,11,14,18],  preisQm: [3500, 4800, 6000, 8000] },
  { keys: ["mannheim"],               mieteQm: [7,10,13,17],  preisQm: [3000, 4200, 5500, 7000] },
  { keys: ["münster","muenster"],     mieteQm: [8,11,14,18],  preisQm: [3500, 4800, 6200, 8000] },
  { keys: ["hannover"],               mieteQm: [7,10,13,16],  preisQm: [2500, 3500, 4500, 6000] },
  { keys: ["dresden"],                mieteQm: [7,10,13,16],  preisQm: [2500, 3500, 4800, 6500] },
  { keys: ["leipzig"],                mieteQm: [6,9,12,15],   preisQm: [2200, 3200, 4500, 6000] },
  { keys: ["potsdam"],                mieteQm: [9,12,16,20],  preisQm: [3800, 5200, 7000, 9500] },
  { keys: ["bremen"],                 mieteQm: [7,9,12,15],   preisQm: [2200, 3200, 4200, 5500] },
  { keys: ["dortmund"],               mieteQm: [6,8,11,14],   preisQm: [1800, 2500, 3500, 4800] },
  { keys: ["essen"],                  mieteQm: [5,7,10,13],   preisQm: [1500, 2200, 3200, 4500] },
  { keys: ["aachen"],                 mieteQm: [7,10,13,17],  preisQm: [2500, 3500, 4500, 6000] },
  { keys: ["erfurt"],                 mieteQm: [6,8,11,14],   preisQm: [2000, 3000, 4000, 5500] },
  { keys: ["rostock"],                mieteQm: [7,9,12,15],   preisQm: [2500, 3500, 4500, 6000] },
];

const LAGEN = ["einfach","mittel","gut","sehr gut"];

function lookupMarkt(adr, lage) {
  if (!adr) return null;
  const lower = adr.toLowerCase();
  const idx = Math.max(0, LAGEN.indexOf(lage));
  for (const entry of MARKT) {
    if (entry.keys.some(k => lower.includes(k))) {
      return {
        city: entry.keys[0],
        mieteQm: entry.mieteQm[idx],
        preisQm: entry.preisQm[idx],
      };
    }
  }
  return null;
}

// ── KPI calculation ───────────────────────────────────────────────────────────
function calcKPIs(kp, wfl, km, { hg = 0, ihq = 10, ma = 0, d1p = 0.8, z1 = 0.04, t1 = 0.02 } = {}) {
  if (!kp || !wfl || !km) return null;
  const preisQm  = kp / wfl;
  const mieteQm  = km / wfl;
  const br       = km * 12 / kp;
  const verv     = kp / (km * 12);
  const ihm      = wfl * ihq / 12;
  const mam      = ma * km;
  const nkPct    = 0.065 + 0.015 + 0.005;
  const gi       = kp * (1 + nkPct);
  const nmr      = gi > 0 ? (km - hg - ihm - mam) * 12 / gi : 0;
  const dg       = d1p * kp;
  const rm       = (z1 + t1) * dg / 12;
  const bg       = hg + ihm + mam;
  const cfop     = km - bg - rm;
  const dscr     = rm > 0 ? km / rm : 99;
  const noi      = (km - hg - ihm - mam) * 12;
  const debtYield = dg > 0 ? noi / dg : 0;
  const ek       = gi - dg;
  const coc      = ek > 0 ? cfop * 12 / ek : 0;
  return { preisQm, mieteQm, br, verv, nmr, cfop, dscr, noi, debtYield, coc };
}

// ── Color helpers ─────────────────────────────────────────────────────────────
// For a column of values, find best/worst and color accordingly
function rankColor(val, allVals, higherIsBetter) {
  const valid = allVals.filter(v => v != null);
  if (valid.length < 2) return "";
  const best  = higherIsBetter ? Math.max(...valid) : Math.min(...valid);
  const worst = higherIsBetter ? Math.min(...valid) : Math.max(...valid);
  if (Math.abs(val - best) < Math.abs(best - worst) * 0.01) return "bg-green-100 text-green-800 font-semibold";
  if (Math.abs(val - worst) < Math.abs(best - worst) * 0.01) return "bg-red-100 text-red-700";
  return "";
}

// ── Market gauge bar ─────────────────────────────────────────────────────────
function Gauge({ label, value, lo, hi, suffix, higherIsBetter }) {
  if (value == null || lo == null) return null;
  const pct = Math.max(0, Math.min(1, (value - lo) / (hi - lo + 0.001)));
  const good = higherIsBetter ? pct > 0.5 : pct < 0.5;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-300 via-amber-300 to-green-400 opacity-30 rounded-full" />
        <div
          className={`absolute top-0 h-full w-2 rounded-full border-2 ${good ? "border-green-600 bg-green-500" : "border-amber-500 bg-amber-400"}`}
          style={{ left: `calc(${pct*100}% - 4px)` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums w-20 text-right ${good ? "text-green-700" : "text-amber-600"}`}>
        {typeof value === "number" && value > 100
          ? value.toLocaleString("de-DE", { maximumFractionDigits: 0 })
          : value.toFixed(2)}{suffix}
      </span>
      <span className="text-[10px] text-gray-400 w-28 text-right">Spanne: {lo}–{hi}{suffix}</span>
    </div>
  );
}

const EMPTY_COMP = { name: "", kp: 0, wfl: 0, km: 0 };

export default function Benchmarking({ result, inputs }) {
  const [comps, setComps] = useState([{ ...EMPTY_COMP }, { ...EMPTY_COMP }, { ...EMPTY_COMP }]);

  if (!result) return null;
  const { s } = result;

  const markt = lookupMarkt(inputs.adr, inputs.lage || "mittel");

  // Current property KPIs
  const main = {
    name: inputs.adr || "Diese Immobilie",
    preisQm: inputs.kp / (inputs.wfl || 1),
    mieteQm: inputs.km / (inputs.wfl || 1),
    br: s.br, verv: s.verv, nmr: s.nmr,
    cfop: s.cfop, dscr: s.rm > 0 ? inputs.km / s.rm : 99,
    noi: s.noi, debtYield: s.debtYield, coc: s.coc,
  };

  // Comparison KPIs
  const compKPIs = comps.map(c => {
    if (!c.kp || !c.wfl || !c.km) return null;
    return { name: c.name || "Vergleich", ...calcKPIs(c.kp, c.wfl, c.km) };
  });

  const allProps = [main, ...compKPIs].filter(Boolean);

  // KPI definitions for table
  const KPIS = [
    { key: "preisQm",    label: "Kaufpreis / m²",       fmt: v => `${v.toLocaleString("de-DE",{maximumFractionDigits:0})} €`, higherIsBetter: false },
    { key: "mieteQm",    label: "Kaltmiete / m²",        fmt: v => `${v.toFixed(2)} €`, higherIsBetter: true },
    { key: "br",         label: "Bruttomietrendite",     fmt: fp, higherIsBetter: true },
    { key: "nmr",        label: "Nettomietrendite",      fmt: fp, higherIsBetter: true },
    { key: "verv",       label: "Vervielfältiger",       fmt: v => `${v.toFixed(1)}×`, higherIsBetter: false },
    { key: "cfop",       label: "CF operativ / Monat",  fmt: fe, higherIsBetter: true },
    { key: "dscr",       label: "DSCR",                  fmt: v => v.toFixed(2), higherIsBetter: true },
    { key: "debtYield",  label: "Debt Yield",            fmt: fp, higherIsBetter: true },
    { key: "coc",        label: "Cash-on-Cash",          fmt: fp, higherIsBetter: true },
    { key: "noi",        label: "NOI / Jahr",            fmt: fe, higherIsBetter: true },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      {/* ── Market Check ── */}
      {markt && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-800 mb-1">Markt-Check — {markt.city.charAt(0).toUpperCase() + markt.city.slice(1)} ({inputs.lage || "mittel"})</h2>
          <p className="text-xs text-gray-400 mb-5">Wo steht diese Immobilie im Vergleich zur typischen Marktspanne? Balken = Position zwischen einfach (links) und sehr gut (rechts).</p>
          <div className="flex flex-col gap-3">
            <Gauge label="Kaufpreis / m²" value={main.preisQm}
              lo={MARKT.find(m=>m.keys.includes(markt.city))?.preisQm[0]}
              hi={MARKT.find(m=>m.keys.includes(markt.city))?.preisQm[3]}
              suffix=" €/m²" higherIsBetter={false} />
            <Gauge label="Kaltmiete / m²" value={main.mieteQm}
              lo={MARKT.find(m=>m.keys.includes(markt.city))?.mieteQm[0]}
              hi={MARKT.find(m=>m.keys.includes(markt.city))?.mieteQm[3]}
              suffix=" €/m²" higherIsBetter={true} />
            <Gauge label="Bruttomietrendite" value={s.br * 100}
              lo={1.5} hi={6} suffix=" %" higherIsBetter={true} />
            <Gauge label="Vervielfältiger" value={s.verv}
              lo={15} hi={50} suffix="×" higherIsBetter={false} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3 text-xs">
            {[
              { label: "Markt Miete / m²",  val: `${markt.mieteQm} €/m² → ${(markt.mieteQm * inputs.wfl).toLocaleString("de-DE")} €/M gesamt` },
              { label: "Markt Preis / m²",  val: `${markt.preisQm.toLocaleString("de-DE")} €/m² → ${(markt.preisQm * inputs.wfl / 1000).toFixed(0)} k€ gesamt` },
              { label: "Deine Miete / m²",  val: `${(inputs.km / inputs.wfl).toFixed(2)} €/m² (${inputs.km > markt.mieteQm * inputs.wfl ? "▲ über" : "▼ unter"} Markt)` },
              { label: "Dein Preis / m²",   val: `${(inputs.kp / inputs.wfl).toLocaleString("de-DE")} €/m² (${inputs.kp > markt.preisQm * inputs.wfl ? "▲ teurer" : "▼ günstiger"} als Markt)` },
            ].map(({ label, val }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-400 mb-1">{label}</p>
                <p className="font-semibold text-gray-800">{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Comparison inputs ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-4">Vergleichsobjekte hinzufügen</h2>
        <div className="grid grid-cols-3 gap-4">
          {comps.map((c, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2.5">
              <input
                placeholder={`Objekt ${i+1} Name`}
                value={c.name}
                onChange={e => setComps(p => p.map((x,j) => j===i ? {...x,name:e.target.value} : x))}
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-green-400"
              />
              {[
                { key: "kp",  label: "Kaufpreis (€)", step: 5000 },
                { key: "wfl", label: "Wohnfläche (m²)", step: 5 },
                { key: "km",  label: "Kaltmiete/M (€)", step: 25 },
              ].map(({ key, label, step }) => (
                <div key={key}>
                  <label className="text-[10px] text-gray-400 uppercase tracking-wide block mb-0.5">{label}</label>
                  <input
                    type="number" step={step} value={c[key] || ""}
                    placeholder="0"
                    onChange={e => setComps(p => p.map((x,j) => j===i ? {...x,[key]:Number(e.target.value)} : x))}
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-green-400"
                  />
                  {c[key] >= 10000 && (
                    <p className="text-[10px] text-green-600 mt-0.5">= {c[key].toLocaleString("de-DE")} €</p>
                  )}
                </div>
              ))}
              {compKPIs[i] && (
                <div className="mt-1 pt-2 border-t border-gray-100 text-xs space-y-1">
                  <div className="flex justify-between text-gray-500"><span>Preis/m²</span><span className="font-semibold">{compKPIs[i].preisQm.toLocaleString("de-DE",{maximumFractionDigits:0})} €</span></div>
                  <div className="flex justify-between text-gray-500"><span>Bruttomietrendite</span><span className="font-semibold">{fp(compKPIs[i].br)}</span></div>
                  <div className="flex justify-between text-gray-500"><span>Vervielfältiger</span><span className="font-semibold">{compKPIs[i].verv.toFixed(1)}×</span></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Comparison table ── */}
      {allProps.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-800 mb-4">KPI-Vergleich</h2>
          <p className="text-xs text-gray-400 mb-4">Grün = bester Wert in der Zeile, Rot = schlechtester. Vergleichsobjekte nutzen Standardfinanzierung (80 % LTV, 4 % Zins, 2 % Tilgung).</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold uppercase text-gray-400">
                  <th className="px-3 py-2 text-left">Kennzahl</th>
                  <th className="px-3 py-2 text-right bg-green-50 text-green-800 border-l-2 border-green-400">
                    {main.name.length > 20 ? main.name.slice(0,18)+"…" : main.name}
                  </th>
                  {compKPIs.map((c, i) => c ? (
                    <th key={i} className="px-3 py-2 text-right">{c.name.length > 20 ? c.name.slice(0,18)+"…" : c.name}</th>
                  ) : null)}
                  {markt && (
                    <th className="px-3 py-2 text-right text-blue-600">Markt {markt.city} ({inputs.lage || "mittel"})</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {KPIS.map(({ key, label, fmt, higherIsBetter }) => {
                  const vals = allProps.map(p => p[key]);
                  return (
                    <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-600 font-medium">{label}</td>
                      <td className={`px-3 py-2 text-right tabular-nums border-l-2 border-green-400 ${rankColor(main[key], vals, higherIsBetter)}`}>
                        {main[key] != null ? fmt(main[key]) : "—"}
                      </td>
                      {compKPIs.map((c, i) => c ? (
                        <td key={i} className={`px-3 py-2 text-right tabular-nums ${rankColor(c[key], vals, higherIsBetter)}`}>
                          {c[key] != null ? fmt(c[key]) : "—"}
                        </td>
                      ) : null)}
                      {markt && (() => {
                        // Market reference values
                        const mktVals = {
                          preisQm: markt.preisQm, mieteQm: markt.mieteQm,
                          br: markt.mieteQm * 12 / markt.preisQm,
                          verv: markt.preisQm / (markt.mieteQm * 12),
                        };
                        const mv = mktVals[key];
                        return (
                          <td className="px-3 py-2 text-right tabular-nums text-blue-600">
                            {mv != null ? fmt(mv) : "—"}
                          </td>
                        );
                      })()}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Reference ranges ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-4">KPI-Richtwerte nach Investmentstrategie</h2>
        <div className="grid grid-cols-3 gap-4 text-xs">
          {[
            { title: "Rendite-Investor", color: "border-green-500 bg-green-50", items: [
              "Bruttomietrendite > 5 %",
              "Nettomietrendite > 4 %",
              "Vervielfältiger < 20×",
              "CF operativ ≥ 0 €/M",
              "DSCR > 1,3",
              "Debt Yield > 8 %",
            ]},
            { title: "Balanced", color: "border-amber-400 bg-amber-50", items: [
              "Bruttomietrendite 4–5 %",
              "Nettomietrendite 3–4 %",
              "Vervielfältiger 20–28×",
              "CF operativ −200 bis 0 €/M",
              "DSCR 1,0–1,3",
              "Debt Yield 5–8 %",
            ]},
            { title: "Wertsteigerungs-Investor", color: "border-blue-400 bg-blue-50", items: [
              "Bruttomietrendite 2–4 %",
              "Nettomietrendite 1,5–3 %",
              "Vervielfältiger 28–50×",
              "CF operativ < −200 €/M",
              "DSCR < 1,0 (akzeptiert)",
              "Wachstumsmarkt entscheidend",
            ]},
          ].map(({ title, color, items }) => (
            <div key={title} className={`rounded-xl border-2 p-4 ${color}`}>
              <p className="font-bold text-gray-800 mb-3">{title}</p>
              <ul className="space-y-1.5">
                {items.map(it => <li key={it} className="flex items-start gap-1.5 text-gray-600"><span className="mt-0.5">·</span>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

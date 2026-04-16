import { fe, fp } from "../../fmt.js";

const GREST = {"Baden-Württemberg":0.05,"Bayern":0.035,"Berlin":0.06,"Brandenburg":0.065,"Bremen":0.05,"Hamburg":0.055,"Hessen":0.06,"Mecklenburg-Vorpommern":0.06,"Niedersachsen":0.05,"Nordrhein-Westfalen":0.065,"Rheinland-Pfalz":0.05,"Saarland":0.065,"Sachsen":0.055,"Sachsen-Anhalt":0.05,"Schleswig-Holstein":0.065,"Thüringen":0.065};

function Row({ label, value, bold }) {
  return (
    <div className={`flex justify-between py-1.5 border-b border-gray-100 text-sm ${bold ? "font-bold" : ""}`}>
      <span className="text-gray-500">{label}</span>
      <span className={bold ? "text-gray-900" : "text-gray-700"}>{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-green-700 mb-4 pb-2 border-b-2 border-green-100">{title}</h3>
      {children}
    </div>
  );
}

export default function Bankgespraech({ result, inputs }) {
  if (!result) return null;
  const { df, s } = result;
  const gr = GREST[inputs.bl] || 0.065;
  const dscr = s.rm > 0 ? s.km / s.rm : 0;
  const ltv = inputs.kp > 0 ? s.dg / inputs.kp : 0;
  const today = new Date().toLocaleDateString("de-DE");

  return (
    <div className="max-w-3xl">
      <div className="no-print flex items-center gap-3 mb-6">
        <button onClick={() => window.print()}
          className="bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-green-800 transition-colors">
          🖨 Drucken / Als PDF speichern
        </button>
        <span className="text-xs text-gray-400">Tipp: Im Druckdialog "Als PDF speichern" wählen</span>
      </div>

      <div id="bank-doc" className="flex flex-col gap-4">
        {/* Header */}
        <div className="bg-gray-900 text-white rounded-xl p-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold">Immobilien-Finanzierungsübersicht</h1>
            <p className="text-gray-400 text-sm mt-1">{inputs.adr || "Objekt"} — {today}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold tabular-nums">{fe(inputs.kp)}</p>
            <p className="text-gray-400 text-xs mt-1">Kaufpreis</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Section title="1. Objektübersicht">
            <Row label="Adresse" value={inputs.adr || "—"} />
            <Row label="Kaufpreis" value={fe(inputs.kp)} bold />
            <Row label="Wohnfläche" value={`${inputs.wfl} m²`} />
            <Row label="Preis / m²" value={fe(inputs.kp / inputs.wfl)} />
            <Row label="Bundesland" value={inputs.bl} />
            <Row label="Kaltmiete" value={`${fe(inputs.km)}/M`} />
            <Row label="Bruttomietrendite" value={fp(s.br)} bold />
            <Row label="Nettomietrendite" value={fp(s.nmr)} bold />
            <Row label="Vervielfältiger" value={`${s.verv.toFixed(1)}x`} />
          </Section>

          <Section title="2. Finanzierungsstruktur">
            <Row label="Eigenkapital" value={fe(s.ek)} bold />
            <Row label="Darlehen I" value={fe(s.d1)} />
            {inputs.d2s > 0 && <Row label="Darlehen II" value={fe(inputs.d2s)} />}
            <Row label="Gesamtdarlehen" value={fe(s.dg)} bold />
            <Row label="Gesamtinvestition" value={fe(s.gi)} bold />
            <Row label="LTV (Beleihungsquote)" value={fp(ltv)} bold />
            <Row label="Zinssatz" value={fp(inputs.z1)} />
            <Row label="Tilgung" value={fp(inputs.t1)} />
            <Row label="Zinsbindung" value={`${inputs.zfest ?? 10} Jahre`} />
            <Row label="Monatliche Rate" value={`${fe(s.rm)}/M`} bold />
            <Row label="DSCR (Mietdeckung)" value={dscr.toFixed(2)} bold />
          </Section>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Section title="3. Kaufnebenkosten">
            <Row label="Grunderwerbsteuer" value={`${fp(gr)} = ${fe(gr * inputs.kp)}`} />
            <Row label="Makler" value={`${fp(inputs.mk)} = ${fe(inputs.mk * inputs.kp)}`} />
            <Row label="Notar" value={`${fp(inputs.no)} = ${fe(inputs.no * inputs.kp)}`} />
            <Row label="Grundbuch" value={`${fp(inputs.gb)} = ${fe(inputs.gb * inputs.kp)}`} />
            <Row label="Gesamt Nebenkosten" value={`${fp(s.nk / inputs.kp)} = ${fe(s.nk)}`} bold />
            {inputs.inv > 0 && <Row label="Renovierung/Sanierung" value={fe(inputs.inv)} />}
            <Row label="Eigenkapitalbedarf gesamt" value={fe(s.ek)} bold />
          </Section>

          <Section title="4. Monatlicher Cashflow (Jahr 1)">
            <Row label="Kaltmiete" value={`+ ${fe(inputs.km)}`} />
            <Row label="− Hausgeld" value={fe(-inputs.hg)} />
            <Row label="− Instandhaltung" value={fe(-s.ihm)} />
            <Row label="− Mietausfall" value={fe(-s.mam)} />
            <Row label="CF operativ (vor Rate)" value={fe(s.cfop + s.rm)} bold />
            <Row label="− Zins" value={fe(-s.zm)} />
            <Row label="− Tilgung" value={fe(-s.tm)} />
            <Row label="CF operativ" value={fe(s.cfop)} bold />
            <Row label="− Steuer" value={fe(-s.stm)} />
            <Row label="CF netto / Monat" value={fe(s.cfn)} bold />
          </Section>
        </div>

        {/* Tilgungsplan 10 Jahre */}
        <Section title="5. Tilgungsplan (Auszug, 10 Jahre)">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-semibold uppercase">
                  {["Jahr","Jahresmiete","Rate/M","Zinsen/J","Tilgung/J","Restschuld","Marktwert","Eigenkapital"].map(h => (
                    <th key={h} className="px-3 py-2 text-right first:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {df.slice(0, 10).map((r, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-3 py-1.5 font-semibold">{r.jr}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{fe(r.mi * 12)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{fe(r.rm)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{fe(r.zi)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{fe(r.ti)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-semibold">{fe(r.rs)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{fe(r.w)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-green-700">{fe(r.nv)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Prognose */}
        <Section title="6. Vermögensprognose">
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: "CF netto / Monat", value: fe(s.cfn) },
              { label: "IRR 10 Jahre", value: s.irr?.[10] != null ? fp(s.irr[10]) : "—" },
              { label: "Nettomietrendite", value: fp(s.nmr) },
              { label: "Tilgungsende", value: s.vtj ? String(s.vtj) : "Offen" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-base font-bold text-green-800 tabular-nums">{value}</p>
              </div>
            ))}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase">
                <th className="px-3 py-2 text-left"></th>
                {[10, 20, 30].map(y => <th key={y} className="px-3 py-2 text-right">Jahr {y}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ["Marktwert", r => fe(r.w)],
                ["Restschuld", r => fe(r.rs)],
                ["Eigenkapital", r => fe(r.nv)],
                ["Kumulierter CF", r => fe(r.kcf)],
                ["Nettovermögen", r => fe(r.tot)],
              ].map(([label, fn]) => (
                <tr key={label} className="border-b border-gray-100">
                  <td className={`px-3 py-1.5 ${label === "Nettovermögen" ? "font-bold" : "text-gray-500"}`}>{label}</td>
                  {[df[9], df[19], df[29]].map((r, i) => (
                    <td key={i} className={`px-3 py-1.5 text-right tabular-nums ${label === "Nettovermögen" ? "font-bold text-green-700" : ""}`}>
                      {r ? fn(r) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <p className="text-xs text-gray-400 text-center py-2">
          ⚠ Kein Ersatz für Finanz-, Steuer- oder Rechtsberatung. Alle Angaben ohne Gewähr.
        </p>
      </div>
    </div>
  );
}

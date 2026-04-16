import { fe, fp } from "../../fmt.js";

const GREST = {"Baden-Württemberg":0.05,"Bayern":0.035,"Berlin":0.06,"Brandenburg":0.065,"Bremen":0.05,"Hamburg":0.055,"Hessen":0.06,"Mecklenburg-Vorpommern":0.06,"Niedersachsen":0.05,"Nordrhein-Westfalen":0.065,"Rheinland-Pfalz":0.05,"Saarland":0.065,"Sachsen":0.055,"Sachsen-Anhalt":0.05,"Schleswig-Holstein":0.065,"Thüringen":0.065};

// ── KPI Thresholds (Grün / Gelb / Rot) ───────────────────────────────────────
const T = {
  br:   { g: 0.05, y: 0.04 },   // Bruttomietrendite
  nmr:  { g: 0.04, y: 0.03 },   // Nettomietrendite
  ekr:  { g: 0.20, y: 0.10 },   // EK-Rendite
  cfop: { g: -63,  y: -125 },   // CF operativ / Monat
  cfn:  { g: -63,  y: -125 },   // CF netto / Monat
  dscr: { g: 1.3,  y: 1.1  },   // DSCR
  ltv:  { g: 0.70, y: 0.80, inv: true }, // LTV (inverted)
  irr10:{ g: 0.10, y: 0.07 },   // IRR 10 Jahre
};

function kpiCls(key, val) {
  const t = T[key]; if (!t) return "text-gray-700 font-bold";
  const ok  = t.inv ? val <= t.g : val >= t.g;
  const mid = t.inv ? val <= t.y : val >= t.y;
  if (ok)  return "text-green-700 font-bold";
  if (mid) return "text-amber-600 font-bold";
  return "text-red-600 font-bold";
}
function kpiBadge(key, val) {
  const t = T[key]; if (!t) return "bg-gray-100 text-gray-600";
  const ok  = t.inv ? val <= t.g : val >= t.g;
  const mid = t.inv ? val <= t.y : val >= t.y;
  if (ok)  return "bg-green-100 text-green-800 border border-green-200";
  if (mid) return "bg-amber-100 text-amber-800 border border-amber-200";
  return "bg-red-100 text-red-800 border border-red-200";
}

// ── Layout helpers ────────────────────────────────────────────────────────────
function Row({ label, value, colorKey, rawValue, bold }) {
  const cls = colorKey ? kpiCls(colorKey, rawValue) : bold ? "text-gray-900 font-bold" : "text-gray-700";
  return (
    <div className={`flex justify-between py-1.5 border-b border-gray-100 text-sm ${bold ? "font-bold" : ""}`}>
      <span className="text-gray-500">{label}</span>
      <span className={cls}>{value}</span>
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

// ── KPI Traffic Light ─────────────────────────────────────────────────────────
function Ampel({ s, inputs }) {
  const ltv = inputs.kp > 0 ? s.dg / inputs.kp : 0;
  const dscr = s.rm > 0 ? s.km / s.rm : 99;
  const items = [
    { label: "Bruttomietrendite", key: "br",    val: s.br,           disp: fp(s.br) },
    { label: "Nettomietrendite",  key: "nmr",   val: s.nmr,          disp: fp(s.nmr) },
    { label: "EK-Rendite",        key: "ekr",   val: s.ekr,          disp: fp(s.ekr) },
    { label: "CF operativ/M",     key: "cfop",  val: s.cfop,         disp: fe(s.cfop) },
    { label: "CF netto/M",        key: "cfn",   val: s.cfn,          disp: fe(s.cfn) },
    { label: "DSCR",              key: "dscr",  val: dscr,           disp: dscr.toFixed(2) },
    { label: "LTV",               key: "ltv",   val: ltv,            disp: fp(ltv) },
    { label: "IRR 10 Jahre",      key: "irr10", val: s.irr?.[10] ?? 0, disp: s.irr?.[10] != null ? fp(s.irr[10]) : "—" },
  ];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-green-700 mb-4 pb-2 border-b-2 border-green-100">Kennzahlen-Ampel</h3>
      <div className="grid grid-cols-4 gap-3">
        {items.map(({ label, key, val, disp }) => (
          <div key={key} className={`rounded-lg px-3 py-2.5 ${kpiBadge(key, val)}`}>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-lg tabular-nums ${kpiCls(key, val)}`}>{disp}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block"></span> Grün = gut</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> Gelb = akzeptabel</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span> Rot = kritisch</span>
      </div>
    </div>
  );
}

// ── Investitionsübersicht ─────────────────────────────────────────────────────
function InvestitionsDoc({ result, inputs }) {
  const { df, s } = result;
  const gr = GREST[inputs.bl] || 0.065;
  const dscr = s.rm > 0 ? s.km / s.rm : 0;
  const ltv = inputs.kp > 0 ? s.dg / inputs.kp : 0;
  const today = new Date().toLocaleDateString("de-DE");

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-gray-900 text-white rounded-xl p-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold">Immobilien-Finanzierungsübersicht</h1>
          <p className="text-gray-400 text-sm mt-1">{inputs.adr || "Objekt"} — {today}</p>
          {inputs.name && <p className="text-gray-300 text-sm mt-0.5">Antragsteller: {inputs.name}</p>}
        </div>
        <div className="text-right">
          <p className="text-3xl font-extrabold tabular-nums">{fe(inputs.kp)}</p>
          <p className="text-gray-400 text-xs mt-1">Kaufpreis</p>
        </div>
      </div>

      {/* Kennzahlen-Ampel */}
      <Ampel s={s} inputs={inputs} />

      <div className="grid grid-cols-2 gap-4">
        <Section title="1. Objektübersicht">
          <Row label="Adresse" value={inputs.adr || "—"} />
          <Row label="Kaufpreis" value={fe(inputs.kp)} bold />
          <Row label="Wohnfläche" value={`${inputs.wfl} m²`} />
          <Row label="Preis / m²" value={fe(inputs.kp / inputs.wfl)} />
          <Row label="Bundesland" value={inputs.bl} />
          <Row label="Kaltmiete" value={`${fe(inputs.km)}/M`} />
          <Row label="Bruttomietrendite" value={fp(s.br)} colorKey="br" rawValue={s.br} />
          <Row label="Nettomietrendite" value={fp(s.nmr)} colorKey="nmr" rawValue={s.nmr} />
          <Row label="Vervielfältiger" value={`${s.verv.toFixed(1)}x`} />
          <Row label="EK-Rendite" value={fp(s.ekr)} colorKey="ekr" rawValue={s.ekr} />
        </Section>

        <Section title="2. Finanzierungsstruktur">
          <Row label="Eigenkapital" value={fe(s.ek)} bold />
          <Row label="Darlehen I" value={fe(s.d1)} />
          {inputs.d2s > 0 && <Row label="Darlehen II" value={fe(inputs.d2s)} />}
          <Row label="Gesamtdarlehen" value={fe(s.dg)} bold />
          <Row label="Gesamtinvestition" value={fe(s.gi)} bold />
          <Row label="LTV (Beleihungsquote)" value={fp(ltv)} colorKey="ltv" rawValue={ltv} />
          <Row label="Eigenkapitalquote" value={fp(1 - ltv)} />
          <Row label="Zinssatz" value={fp(inputs.z1)} />
          <Row label="Tilgung" value={fp(inputs.t1)} />
          <Row label="Zinsbindung" value={`${inputs.zfest ?? 10} Jahre`} />
          <Row label="Monatliche Rate" value={`${fe(s.rm)}/M`} bold />
          <Row label="DSCR (Mietdeckung)" value={dscr.toFixed(2)} colorKey="dscr" rawValue={dscr} />
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
          <Row label="CF operativ (vor Rate)" value={fe(s.cfop + s.rm)} />
          <Row label="− Zins" value={fe(-s.zm)} />
          <Row label="− Tilgung" value={fe(-s.tm)} />
          <Row label="CF operativ" value={fe(s.cfop)} colorKey="cfop" rawValue={s.cfop} />
          <Row label="− Steuer" value={fe(-s.stm)} />
          <Row label="CF netto / Monat" value={fe(s.cfn)} colorKey="cfn" rawValue={s.cfn} />
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
    </div>
  );
}

// ── Vermögensaufstellung ──────────────────────────────────────────────────────
function VermoegenDoc({ inputs, result }) {
  const { s } = result;
  const today = new Date().toLocaleDateString("de-DE");

  const assets = [
    { label: "Liquidität (Giro, Tagesgeld, Sparbuch)", val: inputs.vg_liquid },
    { label: "Wertpapiere / Depot",                    val: inputs.vg_depot },
    { label: `Immobilienvermögen — ${inputs.adr || "diese Immobilie"}`, val: inputs.kp, comment: "Kaufpreis, siehe separate Übersicht" },
    ...(inputs.vg_immo_ext > 0 ? [{ label: "Sonstiges Immobilienvermögen", val: inputs.vg_immo_ext }] : []),
    { label: "Lebensversicherung (Rückkaufswert)",      val: inputs.vg_lv },
    { label: "Bausparvertrag (Guthaben)",               val: inputs.vg_bauspar },
    ...(inputs.vg_sonstiges > 0 ? [{ label: "Sonstiges Vermögen", val: inputs.vg_sonstiges }] : []),
  ];
  const totalAssets = assets.reduce((s, a) => s + a.val, 0);

  const liabilities = [
    { label: "Dispositionskredite",                    val: inputs.vb_dispos,    comment: inputs.vb_dispos === 0 ? "keine" : "" },
    { label: "Konsumkredite / Ratenkredite",           val: inputs.vb_konsum,    comment: inputs.vb_konsum === 0 ? "keine" : "" },
    { label: `Immobiliendarlehen — ${inputs.adr || "diese Immobilie"}`, val: s.dg, comment: "siehe separate Übersicht" },
    ...(inputs.vb_immo_ext > 0 ? [{ label: "Darlehen sonstige Immobilien", val: inputs.vb_immo_ext }] : []),
    { label: "Übernommene Bürgschaften",               val: 0,                   comment: "keine" },
    ...(inputs.vb_sonstiges > 0 ? [{ label: "Sonstige Verbindlichkeiten", val: inputs.vb_sonstiges }] : []),
  ];
  const totalLiabilities = liabilities.reduce((s, l) => s + l.val, 0);
  const netto = totalAssets - totalLiabilities;

  const thStyle = "px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-300 bg-gray-100";
  const tdStyle = "px-3 py-2 text-sm border-b border-gray-100";

  return (
    <div className="flex flex-col gap-6 bg-white rounded-xl border border-gray-200 p-8">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vermögensaufstellung</h1>
          {inputs.name && <p className="text-lg font-semibold text-green-700 mt-1">{inputs.name}</p>}
        </div>
        <p className="text-sm text-gray-500 text-right mt-1">Stichtag: {today}</p>
      </div>

      {/* Persönliche Angaben */}
      {(inputs.name || inputs.anschrift) && (
        <div>
          <div className="bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide rounded-t-lg border border-b-0 border-gray-300">Persönliche Angaben</div>
          <table className="w-full border border-gray-300 rounded-b-lg text-sm">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="px-3 py-2 text-gray-500 w-32">Name</td>
                <td className="px-3 py-2 font-semibold w-64">{inputs.name || "—"}</td>
                <td className="px-3 py-2 text-gray-500 w-32">Familienstand</td>
                <td className="px-3 py-2">{inputs.familienstand}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="px-3 py-2 text-gray-500">Anschrift</td>
                <td className="px-3 py-2">{inputs.anschrift || "—"}</td>
                <td className="px-3 py-2 text-gray-500">Güterstand</td>
                <td className="px-3 py-2">{inputs.gueterstand}</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-gray-500"></td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2 text-gray-500">Kinder</td>
                <td className="px-3 py-2">{inputs.kinder === 0 ? "Keine" : inputs.kinder}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Vermögensgegenstände */}
      <div>
        <div className="bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide rounded-t-lg border border-b-0 border-gray-300">Vermögensverhältnisse</div>
        <table className="w-full border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={thStyle}>Vermögensgegenstände</th>
              <th className={`${thStyle} text-right`}>Betrag</th>
              <th className={`${thStyle}`}>Verpfändet</th>
              <th className={`${thStyle}`}>Kommentar</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(({ label, val, comment }) => (
              <tr key={label}>
                <td className={tdStyle}>{label}</td>
                <td className={`${tdStyle} text-right tabular-nums`}>{fe(val)}</td>
                <td className={tdStyle}>Nein</td>
                <td className={`${tdStyle} text-gray-400 text-xs`}>{comment || ""}</td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td className="px-3 py-2 font-bold text-sm">Summe</td>
              <td className="px-3 py-2 text-right tabular-nums font-bold">{fe(totalAssets)}</td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Verbindlichkeiten */}
      <div>
        <table className="w-full border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={thStyle}>Verbindlichkeiten</th>
              <th className={`${thStyle} text-right`}>Valuta</th>
              <th className={`${thStyle}`} colSpan={2}>Kommentar</th>
            </tr>
          </thead>
          <tbody>
            {liabilities.map(({ label, val, comment }) => (
              <tr key={label}>
                <td className={tdStyle}>{label}</td>
                <td className={`${tdStyle} text-right tabular-nums`}>{fe(val)}</td>
                <td className={`${tdStyle} text-gray-400 text-xs`} colSpan={2}>{comment || ""}</td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td className="px-3 py-2 font-bold text-sm">Summe</td>
              <td className="px-3 py-2 text-right tabular-nums font-bold">{fe(totalLiabilities)}</td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Zusammenfassung */}
      <div>
        <table className="w-full border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={thStyle}>Vermögensaufstellung</th>
              <th className={`${thStyle} text-right`}>Betrag</th>
              <th className={`${thStyle}`}>Kommentar</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className={tdStyle}>Vermögensgegenstände</td>
              <td className={`${tdStyle} text-right tabular-nums`}>{fe(totalAssets)}</td>
              <td className={tdStyle}></td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className={tdStyle}>Verbindlichkeiten</td>
              <td className={`${tdStyle} text-right tabular-nums text-red-600`}>−{fe(totalLiabilities)}</td>
              <td className={tdStyle}></td>
            </tr>
            <tr className="bg-green-50">
              <td className="px-3 py-2 font-bold">Differenz (Netto-Vermögen)</td>
              <td className={`px-3 py-2 text-right tabular-nums font-bold ${netto >= 0 ? "text-green-700" : "text-red-600"}`}>{fe(netto)}</td>
              <td className="px-3 py-2 text-xs text-gray-400">= Netto-Vermögen</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">⚠ Kein Ersatz für Finanz-, Steuer- oder Rechtsberatung. Alle Angaben ohne Gewähr.</p>
    </div>
  );
}

// ── Haushaltsrechnung ─────────────────────────────────────────────────────────
function HaushaltsDoc({ inputs, result }) {
  const { s } = result;
  const today = new Date().toLocaleDateString("de-DE");

  const einnahmen = [
    { label: "Lohn / Gehalt (netto) I",          val: inputs.hh_lohn1 },
    { label: "Lohn / Gehalt (netto) II",          val: inputs.hh_lohn2 },
    { label: "Einkünfte aus selbständiger Arbeit", val: inputs.hh_selbst },
    { label: "Rente / Pension",                    val: inputs.hh_rente },
    { label: `Miet-/Pachteinnahmen — ${inputs.adr || "diese Immo"} (netto/kalt)`, val: inputs.km },
    ...(inputs.hh_mieten > 0 ? [{ label: "Andere Miet-/Pachteinnahmen (netto/kalt)", val: inputs.hh_mieten }] : []),
    ...(inputs.hh_sonst_ein > 0 ? [{ label: "Sonstige Einkünfte", val: inputs.hh_sonst_ein }] : []),
  ];
  const totalEin = einnahmen.reduce((s, e) => s + e.val, 0);

  const ausgaben = [
    { label: "Wohnen inkl. Nebenkosten",                    val: inputs.hh_wohnen, comment: inputs.hh_wohnen > 0 ? "inkl. Strom, Internet, TV etc." : "" },
    { label: "Nahrungs- und Genussmittel",                  val: inputs.hh_nahrung },
    { label: "Anschaffungen",                               val: inputs.hh_anschaffungen, comment: inputs.hh_anschaffungen > 0 ? "inkl. Bekleidung" : "" },
    { label: "Freizeit, Kultur und Hobby",                  val: inputs.hh_freizeit },
    { label: "Urlaub / Reisen",                             val: inputs.hh_urlaub },
    { label: "Kommunikation / IT",                          val: inputs.hh_kommunikation },
    { label: "Private Versicherungen",                      val: inputs.hh_versicherung, comment: "BU, Unfall, Risiko-Leben etc." },
    { label: `Vermietete Immobilien: Bewirtschaftung — ${inputs.adr || "diese Immo"}`, val: Math.round(s.bg), comment: "nicht umlagefähig, inkl. Rücklagen" },
    { label: `Vermietete Immobilien: Kapitaldienst — ${inputs.adr || "diese Immo"}`,   val: Math.round(s.rm), comment: "Zins + Tilgung" },
    ...(inputs.hh_sonst_aus > 0 ? [{ label: "Sonstige Ausgaben", val: inputs.hh_sonst_aus }] : []),
  ];
  const totalAus = ausgaben.reduce((s, e) => s + e.val, 0);
  const ueberschuss = totalEin - totalAus;

  const thStyle = "px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-300 bg-gray-100";
  const tdStyle = "px-3 py-2 text-sm border-b border-gray-100";
  const numStyle = `${tdStyle} text-right tabular-nums`;

  return (
    <div className="flex flex-col gap-6 bg-white rounded-xl border border-gray-200 p-8">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Haushaltsrechnung</h1>
          {inputs.name && <p className="text-lg font-semibold text-green-700 mt-1">{inputs.name}</p>}
        </div>
        <p className="text-sm text-gray-500 text-right mt-1">Stichtag: {today}</p>
      </div>

      {/* Einkünfte */}
      <div>
        <table className="w-full border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={thStyle}>Einkünfte</th>
              <th className={`${thStyle} text-right`}>Betrag p.a.</th>
              <th className={`${thStyle} text-right`}>mntl.</th>
              <th className={thStyle}>Kommentar</th>
            </tr>
          </thead>
          <tbody>
            {einnahmen.map(({ label, val, comment }) => (
              <tr key={label}>
                <td className={tdStyle}>{label}</td>
                <td className={numStyle}>{fe(val * 12)}</td>
                <td className={numStyle}>{fe(val)}</td>
                <td className={`${tdStyle} text-gray-400 text-xs`}>{comment || ""}</td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td className="px-3 py-2 font-bold">Summe</td>
              <td className="px-3 py-2 text-right tabular-nums font-bold">{fe(totalEin * 12)}</td>
              <td className="px-3 py-2 text-right tabular-nums font-bold">{fe(totalEin)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Ausgaben */}
      <div>
        <table className="w-full border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={thStyle}>Ausgaben</th>
              <th className={`${thStyle} text-right`}>Betrag p.a.</th>
              <th className={`${thStyle} text-right`}>mntl.</th>
              <th className={thStyle}>Kommentar</th>
            </tr>
          </thead>
          <tbody>
            {ausgaben.map(({ label, val, comment }) => (
              <tr key={label}>
                <td className={tdStyle}>{label}</td>
                <td className={numStyle}>{fe(val * 12)}</td>
                <td className={numStyle}>{fe(val)}</td>
                <td className={`${tdStyle} text-gray-400 text-xs`}>{comment || ""}</td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td className="px-3 py-2 font-bold">Summe</td>
              <td className="px-3 py-2 text-right tabular-nums font-bold">{fe(totalAus * 12)}</td>
              <td className="px-3 py-2 text-right tabular-nums font-bold">{fe(totalAus)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Haushaltsüberschuss */}
      <div>
        <table className="w-full border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className={thStyle}>Haushaltsüberschuss</th>
              <th className={`${thStyle} text-right`}>Betrag p.a.</th>
              <th className={`${thStyle} text-right`}>mntl.</th>
              <th className={thStyle}>Kommentar</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className={tdStyle}>Einnahmen</td>
              <td className={numStyle}>{fe(totalEin * 12)}</td>
              <td className={numStyle}>{fe(totalEin)}</td>
              <td className={tdStyle}></td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className={tdStyle}>Ausgaben</td>
              <td className={numStyle}>{fe(totalAus * 12)}</td>
              <td className={numStyle}>{fe(totalAus)}</td>
              <td className={tdStyle}></td>
            </tr>
            <tr className={ueberschuss >= 0 ? "bg-green-50" : "bg-red-50"}>
              <td className="px-3 py-2 font-bold">Differenz</td>
              <td className={`px-3 py-2 text-right tabular-nums font-bold ${ueberschuss >= 0 ? "text-green-700" : "text-red-600"}`}>{fe(ueberschuss * 12)}</td>
              <td className={`px-3 py-2 text-right tabular-nums font-bold ${ueberschuss >= 0 ? "text-green-700" : "text-red-600"}`}>{fe(ueberschuss)}</td>
              <td className="px-3 py-2 text-xs text-gray-400">= Haushaltsüberschuss</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">⚠ Kein Ersatz für Finanz-, Steuer- oder Rechtsberatung. Alle Angaben ohne Gewähr.</p>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Bankgespraech({ result, inputs }) {
  if (!result) return null;

  return (
    <div className="max-w-3xl">
      {/* Print controls */}
      <div className="no-print flex items-center gap-3 mb-6">
        <button onClick={() => window.print()}
          className="bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-green-800 transition-colors">
          Drucken / Als PDF speichern
        </button>
        <span className="text-xs text-gray-400">Alle 3 Dokumente werden gedruckt: Investitionsübersicht · Vermögensaufstellung · Haushaltsrechnung</span>
      </div>

      {/* Dokument 1: Investitionsübersicht */}
      <InvestitionsDoc result={result} inputs={inputs} />

      {/* Dokument 2: Vermögensaufstellung */}
      <div className="mt-10 print:break-before-page">
        <p className="no-print text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 mt-2">Dokument 2 — Vermögensaufstellung</p>
        <VermoegenDoc inputs={inputs} result={result} />
      </div>

      {/* Dokument 3: Haushaltsrechnung */}
      <div className="mt-10 print:break-before-page">
        <p className="no-print text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 mt-2">Dokument 3 — Haushaltsrechnung</p>
        <HaushaltsDoc inputs={inputs} result={result} />
      </div>

      <p className="text-xs text-gray-400 text-center py-4 mt-4">
        ⚠ Kein Ersatz für Finanz-, Steuer- oder Rechtsberatung. Alle Angaben ohne Gewähr.
      </p>
    </div>
  );
}

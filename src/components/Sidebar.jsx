import { useState } from "react";

const BUNDESLAENDER = [
  "Baden-Württemberg","Bayern","Berlin","Brandenburg","Bremen","Hamburg",
  "Hessen","Mecklenburg-Vorpommern","Niedersachsen","Nordrhein-Westfalen",
  "Rheinland-Pfalz","Saarland","Sachsen","Sachsen-Anhalt","Schleswig-Holstein","Thüringen"
];
const BAUJAHRE = ["vor 1925","1925-1950","1951-1960","1961-1970","1971-1980","1981-1990","1991-2000","2001-2010","ab 2010"];
const GREST = {"Baden-Württemberg":0.05,"Bayern":0.035,"Berlin":0.06,"Brandenburg":0.065,"Bremen":0.05,"Hamburg":0.055,"Hessen":0.06,"Mecklenburg-Vorpommern":0.06,"Niedersachsen":0.05,"Nordrhein-Westfalen":0.065,"Rheinland-Pfalz":0.05,"Saarland":0.065,"Sachsen":0.055,"Sachsen-Anhalt":0.05,"Schleswig-Holstein":0.065,"Thüringen":0.065};

function Section({ title, open, onToggle, children }) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-700 uppercase tracking-wider text-gray-500">{title}</span>
        <span className={`text-gray-400 text-sm transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {children}
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 transition-colors";

function NumInput({ value, onChange, min, max, step = 1, suffix }) {
  return (
    <div className="relative">
      <input
        type="number"
        className={`${inputCls} ${suffix ? "pr-9" : ""}`}
        value={value} min={min} max={max} step={step}
        onChange={e => onChange(Number(e.target.value))}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{suffix}</span>
      )}
    </div>
  );
}

function SelectInput({ value, onChange, options }) {
  return (
    <select className={inputCls} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-9 h-5 rounded-full transition-colors ${value ? "bg-brand-500" : "bg-gray-300"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? "left-4" : "left-0.5"}`} />
    </button>
  );
}

function Row2({ children }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

const FAMILIENSTAND = ["Ledig", "Verheiratet", "Eingetragene Partnerschaft", "Getrennt lebend", "Geschieden", "Verwitwet"];
const GUETERSTAND   = ["Zugewinn", "Gütertrennung", "Gütergemeinschaft"];

export default function Sidebar({ inputs, update }) {
  const [open, setOpen] = useState({ objekt: true, finanz: true, kosten: false, prognose: false, steuer: false, person: false, vermoegen: false, haushalt: false });
  const toggle = k => setOpen(o => ({ ...o, [k]: !o[k] }));
  const gr = GREST[inputs.bl] || 0.065;

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 h-screen overflow-y-auto flex flex-col">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-100">
        <p className="text-xs font-bold text-brand-600 uppercase tracking-widest">Investment Tools</p>
        <h1 className="text-base font-bold text-gray-900 mt-0.5">Immobilien-Kalkulator</h1>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* Objekt */}
        <Section title="Objekt" open={open.objekt} onToggle={() => toggle("objekt")}>
          <Field label="Adresse">
            <input className={inputCls} value={inputs.adr} onChange={e => update("adr", e.target.value)} placeholder="z.B. Düsseldorf, Musterstr. 1" />
          </Field>
          <Row2>
            <Field label="Kaufpreis">
              <NumInput value={inputs.kp} onChange={v => update("kp", v)} min={10000} step={5000} suffix="€" />
            </Field>
            <Field label="Wohnfläche">
              <NumInput value={inputs.wfl} onChange={v => update("wfl", v)} min={10} step={5} suffix="m²" />
            </Field>
          </Row2>
          <Field label="Kaltmiete / Monat">
            <NumInput value={inputs.km} onChange={v => update("km", v)} min={0} step={25} suffix="€" />
          </Field>
          <Field label="Bundesland" hint={`Grunderwerbsteuer: ${(gr * 100).toFixed(1)} %`}>
            <SelectInput value={inputs.bl} onChange={v => update("bl", v)} options={BUNDESLAENDER} />
          </Field>
        </Section>

        {/* Finanzierung */}
        <Section title="Finanzierung" open={open.finanz} onToggle={() => toggle("finanz")}>
          <Field label="Eigenkapital-Anteil" hint={`Darlehen: ${((inputs.d1p * inputs.kp) / 1000).toFixed(0)} k€`}>
            <NumInput value={Math.round((1 - inputs.d1p) * 100)} onChange={v => update("d1p", (100 - v) / 100)} min={0} max={100} step={5} suffix="% EK" />
          </Field>
          <Row2>
            <Field label="Zinssatz">
              <NumInput value={(inputs.z1 * 100).toFixed(2)} onChange={v => update("z1", v / 100)} min={0} max={15} step={0.05} suffix="%" />
            </Field>
            <Field label="Tilgung">
              <NumInput value={(inputs.t1 * 100).toFixed(1)} onChange={v => update("t1", v / 100)} min={0} max={10} step={0.1} suffix="%" />
            </Field>
          </Row2>
          <Row2>
            <Field label="Zinsbindung">
              <NumInput value={inputs.zfest ?? 10} onChange={v => update("zfest", v)} min={1} max={30} step={1} suffix="J" />
            </Field>
            <Field label="Anschlusszins">
              <NumInput value={(inputs.zans * 100).toFixed(2)} onChange={v => update("zans", v / 100)} min={0} max={15} step={0.05} suffix="%" />
            </Field>
          </Row2>
        </Section>

        {/* Kosten */}
        <Section title="Kosten & Nebenkosten" open={open.kosten} onToggle={() => toggle("kosten")}>
          <Field label="Grundsteuer & NK / M" hint="Nicht umlagefähige monatliche NK">
            <NumInput value={inputs.gsm} onChange={v => update("gsm", v)} min={0} step={10} suffix="€" />
          </Field>
          <Field label="Hausgeld (WEG) / M">
            <NumInput value={inputs.hg} onChange={v => update("hg", v)} min={0} step={10} suffix="€" />
          </Field>
          <Field label="Instandhaltung & Erneuerung" hint="Rücklage: Standard 8–12 €/m²/J">
            <NumInput value={inputs.ihq} onChange={v => update("ihq", v)} min={0} max={50} step={1} suffix="€/m²/J" />
          </Field>
          <Field label="Mietausfallrisiko">
            <NumInput value={Math.round(inputs.ma * 100)} onChange={v => update("ma", v / 100)} min={0} max={30} step={1} suffix="%" />
          </Field>
          <Field label="Anfangsinvestition (Sanierung)">
            <NumInput value={inputs.inv} onChange={v => update("inv", v)} min={0} step={5000} suffix="€" />
          </Field>
          <Row2>
            <Field label="Makler">
              <NumInput value={(inputs.mk * 100).toFixed(1)} onChange={v => update("mk", v / 100)} min={0} max={10} step={0.5} suffix="%" />
            </Field>
            <Field label="Notar">
              <NumInput value={(inputs.no * 100).toFixed(1)} onChange={v => update("no", v / 100)} min={0} max={5} step={0.1} suffix="%" />
            </Field>
          </Row2>
          <Field label="Grundbuch">
            <NumInput value={(inputs.gb * 100).toFixed(1)} onChange={v => update("gb", v / 100)} min={0} max={2} step={0.1} suffix="%" />
          </Field>
        </Section>

        {/* Prognose */}
        <Section title="Prognose" open={open.prognose} onToggle={() => toggle("prognose")}>
          <Field label="Mietsteigerung p.a." hint="Historisch ~2–3 %">
            <NumInput value={(inputs.mst * 100).toFixed(1)} onChange={v => update("mst", v / 100)} min={0} max={10} step={0.5} suffix="%" />
          </Field>
          <Field label="Wertsteigerung p.a." hint="Immo DE langfristig ~2–3 %">
            <NumInput value={(inputs.wst * 100).toFixed(1)} onChange={v => update("wst", v / 100)} min={-5} max={15} step={0.5} suffix="%" />
          </Field>
          <Field label="Kostensteigerung p.a.">
            <NumInput value={(inputs.kst * 100).toFixed(1)} onChange={v => update("kst", v / 100)} min={0} max={10} step={0.5} suffix="%" />
          </Field>
        </Section>

        {/* Steuer & AfA */}
        <Section title="Steuer & AfA" open={open.steuer} onToggle={() => toggle("steuer")}>
          <Field label="Baujahr" hint="Bestimmt AfA-Satz (2 % oder 2,5 %)">
            <SelectInput value={inputs.bj} onChange={v => update("bj", v)} options={BAUJAHRE} />
          </Field>
          <Field label="Gebäudeanteil" hint="Grundstück nicht absetzbar">
            <NumInput value={Math.round(inputs.ga * 100)} onChange={v => update("ga", v / 100)} min={0} max={100} step={5} suffix="%" />
          </Field>
          <Field label="Steuerveranlagung">
            <SelectInput value={inputs.vl} onChange={v => update("vl", v)} options={["Einzeln", "Gemeinsam"]} />
          </Field>
          <Field label="Zu versteuerndes Einkommen">
            <NumInput value={inputs.zve} onChange={v => update("zve", v)} min={0} step={5000} suffix="€/J" />
          </Field>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kirchensteuer</span>
            <Toggle value={inputs.ki} onChange={v => update("ki", v)} />
          </div>
        </Section>

        {/* Persönliche Daten */}
        <Section title="Persönliche Daten" open={open.person} onToggle={() => toggle("person")}>
          <p className="text-xs text-gray-400 -mt-1 mb-1">Für Bankgespräch-Dokumente</p>
          <Field label="Name">
            <input className={inputCls} value={inputs.name} onChange={e => update("name", e.target.value)} placeholder="Max Mustermann" />
          </Field>
          <Field label="Anschrift">
            <input className={inputCls} value={inputs.anschrift} onChange={e => update("anschrift", e.target.value)} placeholder="Musterstr. 1, 12345 Stadt" />
          </Field>
          <Row2>
            <Field label="Familienstand">
              <SelectInput value={inputs.familienstand} onChange={v => update("familienstand", v)} options={FAMILIENSTAND} />
            </Field>
            <Field label="Güterstand">
              <SelectInput value={inputs.gueterstand} onChange={v => update("gueterstand", v)} options={GUETERSTAND} />
            </Field>
          </Row2>
          <Field label="Kinder">
            <NumInput value={inputs.kinder} onChange={v => update("kinder", v)} min={0} max={20} step={1} />
          </Field>
        </Section>

        {/* Vermögen & Schulden */}
        <Section title="Vermögen & Schulden" open={open.vermoegen} onToggle={() => toggle("vermoegen")}>
          <p className="text-xs text-gray-400 -mt-1 mb-1">Außer diese Immobilie — für Vermögensaufstellung</p>
          <Field label="Liquidität (Giro/Tagesgeld)">
            <NumInput value={inputs.vg_liquid} onChange={v => update("vg_liquid", v)} min={0} step={1000} suffix="€" />
          </Field>
          <Field label="Wertpapiere / Depot">
            <NumInput value={inputs.vg_depot} onChange={v => update("vg_depot", v)} min={0} step={1000} suffix="€" />
          </Field>
          <Field label="Sonstiges Immobilienvermögen">
            <NumInput value={inputs.vg_immo_ext} onChange={v => update("vg_immo_ext", v)} min={0} step={10000} suffix="€" />
          </Field>
          <Row2>
            <Field label="Lebensversicherung">
              <NumInput value={inputs.vg_lv} onChange={v => update("vg_lv", v)} min={0} step={1000} suffix="€" />
            </Field>
            <Field label="Bausparvertrag">
              <NumInput value={inputs.vg_bauspar} onChange={v => update("vg_bauspar", v)} min={0} step={1000} suffix="€" />
            </Field>
          </Row2>
          <Field label="Sonstiges Vermögen">
            <NumInput value={inputs.vg_sonstiges} onChange={v => update("vg_sonstiges", v)} min={0} step={1000} suffix="€" />
          </Field>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">Verbindlichkeiten</p>
          <Row2>
            <Field label="Dispositionskredite">
              <NumInput value={inputs.vb_dispos} onChange={v => update("vb_dispos", v)} min={0} step={500} suffix="€" />
            </Field>
            <Field label="Konsumkredite">
              <NumInput value={inputs.vb_konsum} onChange={v => update("vb_konsum", v)} min={0} step={1000} suffix="€" />
            </Field>
          </Row2>
          <Row2>
            <Field label="Darlehen sonstige Immo">
              <NumInput value={inputs.vb_immo_ext} onChange={v => update("vb_immo_ext", v)} min={0} step={10000} suffix="€" />
            </Field>
            <Field label="Sonstige Schulden">
              <NumInput value={inputs.vb_sonstiges} onChange={v => update("vb_sonstiges", v)} min={0} step={1000} suffix="€" />
            </Field>
          </Row2>
        </Section>

        {/* Haushaltsrechnung */}
        <Section title="Haushaltsrechnung" open={open.haushalt} onToggle={() => toggle("haushalt")}>
          <p className="text-xs text-gray-400 -mt-1 mb-1">Monatliche Einnahmen & Ausgaben (ohne diese Immo)</p>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Einnahmen / Monat</p>
          <Row2>
            <Field label="Lohn/Gehalt I">
              <NumInput value={inputs.hh_lohn1} onChange={v => update("hh_lohn1", v)} min={0} step={100} suffix="€" />
            </Field>
            <Field label="Lohn/Gehalt II">
              <NumInput value={inputs.hh_lohn2} onChange={v => update("hh_lohn2", v)} min={0} step={100} suffix="€" />
            </Field>
          </Row2>
          <Row2>
            <Field label="Selbständige Arb.">
              <NumInput value={inputs.hh_selbst} onChange={v => update("hh_selbst", v)} min={0} step={100} suffix="€" />
            </Field>
            <Field label="Rente/Pension">
              <NumInput value={inputs.hh_rente} onChange={v => update("hh_rente", v)} min={0} step={100} suffix="€" />
            </Field>
          </Row2>
          <Row2>
            <Field label="Andere Mieten">
              <NumInput value={inputs.hh_mieten} onChange={v => update("hh_mieten", v)} min={0} step={100} suffix="€" />
            </Field>
            <Field label="Sonstige">
              <NumInput value={inputs.hh_sonst_ein} onChange={v => update("hh_sonst_ein", v)} min={0} step={100} suffix="€" />
            </Field>
          </Row2>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">Ausgaben / Monat</p>
          <Row2>
            <Field label="Wohnen inkl. NK">
              <NumInput value={inputs.hh_wohnen} onChange={v => update("hh_wohnen", v)} min={0} step={50} suffix="€" />
            </Field>
            <Field label="Nahrung">
              <NumInput value={inputs.hh_nahrung} onChange={v => update("hh_nahrung", v)} min={0} step={50} suffix="€" />
            </Field>
          </Row2>
          <Row2>
            <Field label="Anschaffungen">
              <NumInput value={inputs.hh_anschaffungen} onChange={v => update("hh_anschaffungen", v)} min={0} step={50} suffix="€" />
            </Field>
            <Field label="Freizeit/Hobby">
              <NumInput value={inputs.hh_freizeit} onChange={v => update("hh_freizeit", v)} min={0} step={50} suffix="€" />
            </Field>
          </Row2>
          <Row2>
            <Field label="Urlaub/Reisen">
              <NumInput value={inputs.hh_urlaub} onChange={v => update("hh_urlaub", v)} min={0} step={50} suffix="€" />
            </Field>
            <Field label="Kommunikation">
              <NumInput value={inputs.hh_kommunikation} onChange={v => update("hh_kommunikation", v)} min={0} step={25} suffix="€" />
            </Field>
          </Row2>
          <Row2>
            <Field label="Versicherungen">
              <NumInput value={inputs.hh_versicherung} onChange={v => update("hh_versicherung", v)} min={0} step={25} suffix="€" />
            </Field>
            <Field label="Sonstiges">
              <NumInput value={inputs.hh_sonst_aus} onChange={v => update("hh_sonst_aus", v)} min={0} step={50} suffix="€" />
            </Field>
          </Row2>
        </Section>
      </div>
    </aside>
  );
}

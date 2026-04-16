import { useState, useEffect } from "react";

const ITEMS = [
  // Lage & Markt
  { id: "lage_01", cat: "Lage & Markt", text: "ÖPNV-Anbindung, Schulen, Einkauf vor Ort geprüft" },
  { id: "lage_02", cat: "Lage & Markt", text: "Entwicklung des Viertels eingeschätzt (Aufwertung / Abwertung)" },
  { id: "lage_03", cat: "Lage & Markt", text: "Vergleichsmieten in der Umgebung recherchiert (Mietspiegel)" },
  { id: "lage_04", cat: "Lage & Markt", text: "Leerstandsquote in der Straße / im Gebäude bekannt" },
  { id: "lage_05", cat: "Lage & Markt", text: "Lärmquellen / Emittenten geprüft (Straße, Bahn, Gewerbe)" },
  { id: "lage_06", cat: "Lage & Markt", text: "Hochwasser-/Überschwemmungszonen geprüft (ZÜRS)" },

  // Objekt & Zustand
  { id: "obj_01", cat: "Objekt & Zustand", text: "Mindestens eine Besichtigung vor Ort" },
  { id: "obj_02", cat: "Objekt & Zustand", text: "Bausachverständigen eingeschaltet (empfohlen ab 300k)" },
  { id: "obj_03", cat: "Objekt & Zustand", text: "Baujahr und letzter Sanierungsstand bekannt" },
  { id: "obj_04", cat: "Objekt & Zustand", text: "Heizungsanlage geprüft (Alter, Typ, Wartungsprotokoll)" },
  { id: "obj_05", cat: "Objekt & Zustand", text: "Dach / Fassade / Fenster geprüft" },
  { id: "obj_06", cat: "Objekt & Zustand", text: "Feuchtigkeit, Schimmel, Keller ausgeschlossen" },
  { id: "obj_07", cat: "Objekt & Zustand", text: "Elektrik / Leitungen / Zähler bekannt und ok" },
  { id: "obj_08", cat: "Objekt & Zustand", text: "Grundriss und Wohnfläche verifiziert (Aufmaß)" },
  { id: "obj_09", cat: "Objekt & Zustand", text: "Energieausweis vorgelegen und ausreichend (ggf. Sanierungspflicht?)" },

  // Rechtliches
  { id: "recht_01", cat: "Rechtliches", text: "Grundbuchauszug gelesen — keine unbekannten Lasten / Rechte" },
  { id: "recht_02", cat: "Rechtliches", text: "WEG-Protokolle der letzten 3 Jahre gelesen" },
  { id: "recht_03", cat: "Rechtliches", text: "Teilungserklärung und Gemeinschaftsordnung gelesen" },
  { id: "recht_04", cat: "Rechtliches", text: "Höhe der Instandhaltungsrücklage der WEG bekannt und ausreichend" },
  { id: "recht_05", cat: "Rechtliches", text: "Laufende Beschlüsse / geplante Maßnahmen der WEG bekannt" },
  { id: "recht_06", cat: "Rechtliches", text: "Mietvertrag(e) gelesen — Kündigungsschutz, Miethöhe, Sonderklauseln" },
  { id: "recht_07", cat: "Rechtliches", text: "Kein Vorkaufsrecht Dritter (Mieter, Gemeinde) bekannt" },
  { id: "recht_08", cat: "Rechtliches", text: "Baulastenverzeichnis geprüft" },
  { id: "recht_09", cat: "Rechtliches", text: "Keine laufenden Rechtsstreitigkeiten (WEG, Mieter)" },

  // Finanzielles
  { id: "fin_01", cat: "Finanzielles", text: "Finanzierungszusage von mindestens einer Bank erhalten" },
  { id: "fin_02", cat: "Finanzielles", text: "Eigenkapital inkl. Kaufnebenkosten vollständig vorhanden" },
  { id: "fin_03", cat: "Finanzielles", text: "Liquiditätsreserve von 3–6 Monatsmieten nach Kauf vorhanden" },
  { id: "fin_04", cat: "Finanzielles", text: "Kaufpreis mit Vergleichswerten (Mietspiegel, Gutachter) validiert" },
  { id: "fin_05", cat: "Finanzielles", text: "Renditeberechnung erstellt und Ergebnis akzeptabel" },
  { id: "fin_06", cat: "Finanzielles", text: "Steuerliche Auswirkungen mit Steuerberater besprochen" },
  { id: "fin_07", cat: "Finanzielles", text: "Anschlussfinanzierungsrisiko nach Zinsbindungsende bewertet" },
  { id: "fin_08", cat: "Finanzielles", text: "Hausgeld-Abrechnung der letzten 2 Jahre geprüft" },

  // Kaufprozess
  { id: "kauf_01", cat: "Kaufprozess", text: "Kaufvertragsentwurf vom Notar erhalten und gelesen" },
  { id: "kauf_02", cat: "Kaufprozess", text: "Kaufvertrag ggf. von eigenem Anwalt geprüft" },
  { id: "kauf_03", cat: "Kaufprozess", text: "Notartermin vereinbart" },
  { id: "kauf_04", cat: "Kaufprozess", text: "Übergabedatum und Bedingungen vereinbart" },
  { id: "kauf_05", cat: "Kaufprozess", text: "Gebäudeversicherung ab Übergabe vorbereitet" },
  { id: "kauf_06", cat: "Kaufprozess", text: "Übergabeprotokoll vorbereitet (Zählerstände, Schlüssel)" },
  { id: "kauf_07", cat: "Kaufprozess", text: "Mängelfreiheitsbescheinigung / Abnahme geplant" },
];

const CATS = [...new Set(ITEMS.map(i => i.cat))];

const CAT_COLORS = {
  "Lage & Markt":    { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   dot: "bg-blue-400" },
  "Objekt & Zustand":{ bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  dot: "bg-amber-400" },
  "Rechtliches":     { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", dot: "bg-purple-400" },
  "Finanzielles":    { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  dot: "bg-green-400" },
  "Kaufprozess":     { bg: "bg-gray-50",   border: "border-gray-200",   text: "text-gray-700",   dot: "bg-gray-400" },
};

const STORAGE_KEY = "immo-checkliste";

export default function Checkliste() {
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
  });
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY + "-notes") || "{}"); } catch { return {}; }
  });
  const [openCats, setOpenCats] = useState(Object.fromEntries(CATS.map(c => [c, true])));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + "-notes", JSON.stringify(notes));
  }, [notes]);

  const toggle = id => setChecked(p => ({ ...p, [id]: !p[id] }));
  const toggleCat = cat => setOpenCats(p => ({ ...p, [cat]: !p[cat] }));

  const totalDone = ITEMS.filter(i => checked[i.id]).length;
  const totalAll = ITEMS.length;
  const pct = Math.round(totalDone / totalAll * 100);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      {/* Progress header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800">Due-Diligence Checkliste</h2>
          <span className="text-sm font-bold tabular-nums text-gray-700">{totalDone} / {totalAll} erledigt</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-400" : "bg-gray-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex gap-4 mt-3 flex-wrap">
          {CATS.map(cat => {
            const items = ITEMS.filter(i => i.cat === cat);
            const done  = items.filter(i => checked[i.id]).length;
            const c = CAT_COLORS[cat];
            return (
              <div key={cat} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${c.bg} ${c.border} ${c.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
                {cat}: {done}/{items.length}
              </div>
            );
          })}
        </div>
        {totalDone > 0 && (
          <button
            onClick={() => { if (window.confirm("Alle Häkchen entfernen?")) setChecked({}); }}
            className="mt-3 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Zurücksetzen
          </button>
        )}
      </div>

      {/* Categories */}
      {CATS.map(cat => {
        const items = ITEMS.filter(i => i.cat === cat);
        const done  = items.filter(i => checked[i.id]).length;
        const allDone = done === items.length;
        const c = CAT_COLORS[cat];

        return (
          <div key={cat} className={`rounded-xl border ${c.border} overflow-hidden`}>
            <button
              onClick={() => toggleCat(cat)}
              className={`w-full flex items-center justify-between px-5 py-3 ${c.bg}`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${allDone ? "bg-green-500" : c.dot}`}></span>
                <span className={`text-sm font-bold ${c.text}`}>{cat}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold ${allDone ? "text-green-600" : c.text}`}>
                  {done}/{items.length} {allDone ? "✓" : ""}
                </span>
                <span className={`text-xs ${c.text} transition-transform duration-200 ${openCats[cat] ? "rotate-180" : ""}`}>▾</span>
              </div>
            </button>

            {openCats[cat] && (
              <div className="divide-y divide-gray-100 bg-white">
                {items.map(item => (
                  <div key={item.id} className={`px-5 py-3 transition-colors ${checked[item.id] ? "bg-green-50" : "hover:bg-gray-50"}`}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!checked[item.id]}
                        onChange={() => toggle(item.id)}
                        className="mt-0.5 w-4 h-4 rounded accent-green-600 shrink-0"
                      />
                      <span className={`text-sm leading-snug ${checked[item.id] ? "text-gray-400 line-through" : "text-gray-700"}`}>
                        {item.text}
                      </span>
                    </label>
                    {/* note field */}
                    <div className="ml-7 mt-1">
                      <input
                        type="text"
                        placeholder="Notiz…"
                        value={notes[item.id] || ""}
                        onChange={e => setNotes(p => ({ ...p, [item.id]: e.target.value }))}
                        className="w-full text-xs text-gray-500 bg-transparent border-0 border-b border-dashed border-gray-200 focus:border-gray-400 outline-none py-0.5 placeholder-gray-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

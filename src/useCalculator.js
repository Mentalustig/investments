import { useState, useCallback, useEffect, useRef } from "react";

export const DEFAULT_INPUTS = {
  // Objekt
  adr: "Düsseldorf", wfl: 60, kp: 300000, bl: "Nordrhein-Westfalen",
  // Finanzierung
  d1p: 1.0, z1: 0.0377, t1: 0.01, zfest: 10, zans: 0.0377,
  d2s: 0, z2: 0, t2: 0,
  // Kaufnebenkosten
  mk: 0, no: 0.015, gb: 0.005,
  // Mieteinnahmen
  km: 700, gsm: 120, ma: 0,
  // Bewirtschaftung
  hg: 0, ihq: 10,
  // Anfangsinvestition (Renovierung)
  inv: 0,
  // Prognose
  mst: 0, wst: 0.02, kst: 0.02,
  marktmiete: 0,  // €/M cap für 2%-Staffel; 0 = deaktiviert
  lage: "mittel", // Wohnlage für Mietspiegel-Lookup
  // AfA / Steuer
  bj: "1951-1960", ga: 0.8,
  zve: 200000, vl: "Einzeln", ki: false,

  // ── Persönliche Daten ──────────────────────────────────────────────
  name: "", anschrift: "", familienstand: "Ledig", gueterstand: "Zugewinn", kinder: 0,

  // ── Vermögensgegenstände (außer diese Immobilie) ───────────────────
  vg_liquid: 0,      // Giro, Tagesgeld, Sparbuch
  vg_depot: 0,       // Wertpapiere / Depot
  vg_immo_ext: 0,    // Sonstiges Immobilienvermögen (Verkehrswert)
  vg_lv: 0,          // Lebensversicherung (Rückkaufswert)
  vg_bauspar: 0,     // Bausparverträge (Guthaben)
  vg_sonstiges: 0,

  // ── Verbindlichkeiten (außer diese Immobilie) ─────────────────────
  vb_dispos: 0,      // Dispositionskredite
  vb_konsum: 0,      // Konsumkredite / Ratenkredite
  vb_immo_ext: 0,    // Darlehen für sonstige Immobilien
  vb_sonstiges: 0,

  // ── Haushalt Einnahmen (€/Monat netto) ────────────────────────────
  hh_lohn1: 0, hh_lohn2: 0, hh_selbst: 0, hh_rente: 0,
  hh_mieten: 0,      // Andere Mieteinnahmen (netto/kalt)
  hh_sonst_ein: 0,

  // ── Haushalt Ausgaben (€/Monat, ohne diese Immobilie) ────────────
  hh_wohnen: 0, hh_nahrung: 0, hh_anschaffungen: 0,
  hh_freizeit: 0, hh_urlaub: 0, hh_kommunikation: 0,
  hh_versicherung: 0, hh_sonst_aus: 0,
};

async function apiCall(action, params) {
  const r = await fetch("/api/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export function useCalculator() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [result, setResult] = useState(null);
  const [beKm, setBeKm] = useState(null);
  const [beZ1, setBeZ1] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const recalculate = useCallback(async (inp) => {
    setLoading(true);
    setError(null);
    try {
      const [calcResult, bkResult, bzResult] = await Promise.all([
        apiCall("calculate", inp),
        apiCall("breakeven_km", inp),
        apiCall("breakeven_z1", inp),
      ]);
      setResult(calcResult);
      setBeKm(bkResult.value);
      setBeZ1(bzResult.value);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => recalculate(inputs), 400);
    return () => clearTimeout(debounceRef.current);
  }, [inputs, recalculate]);

  const update = useCallback((key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  const loadScenario = useCallback((scenarioInputs) => {
    setInputs({ ...DEFAULT_INPUTS, ...scenarioInputs });
  }, []);

  return { inputs, update, loadScenario, result, beKm, beZ1, loading, error };
}

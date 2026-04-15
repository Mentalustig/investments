// Hook: calls /api/calculate and manages state
import { useState, useCallback, useEffect, useRef } from "react";

const DEFAULT_INPUTS = {
  kp: 300000, km: 700, z1: 0.0377, t1: 0.01,
  d1p: 1.0, d2s: 0, z2: 0, t2: 0,
  hg: 0, gsm: 120, ihq: 10, wfl: 60, ma: 0,
  mst: 0, wst: 0.02, kst: 0.02,
  bj: "1951-1960", ga: 0.8, inv: 0,
  zve: 200000, vl: "Einzeln", ki: false,
  mk: 0, no: 0.015, gb: 0.005, bl: "Nordrhein-Westfalen",
  adr: "Düsseldorf",
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const recalculate = useCallback(async (inp) => {
    setLoading(true);
    setError(null);
    try {
      const { df, s } = await apiCall("calculate", inp);
      setResult({ df, s });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce recalculation on input change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => recalculate(inputs), 300);
    return () => clearTimeout(debounceRef.current);
  }, [inputs, recalculate]);

  const update = useCallback((key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  const loadScenario = useCallback((scenarioInputs) => {
    setInputs({ ...DEFAULT_INPUTS, ...scenarioInputs });
  }, []);

  return { inputs, update, loadScenario, result, loading, error, DEFAULT_INPUTS };
}

export { DEFAULT_INPUTS };

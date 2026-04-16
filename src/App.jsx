import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth.js";
import { useCalculator } from "./useCalculator.js";
import { useScenarios } from "./useScenarios.js";
import Sidebar from "./components/Sidebar.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import TabRendite from "./components/tabs/Rendite.jsx";
import TabCashflow from "./components/tabs/Cashflow.jsx";
import TabRisiko from "./components/tabs/Risiko.jsx";
import TabBank from "./components/tabs/Bankgespraech.jsx";
import TabSzenarien from "./components/tabs/SzenarienSpeichern.jsx";
import TabSensitivitaet from "./components/tabs/Sensitivitaet.jsx";
import TabCheckliste from "./components/tabs/Checkliste.jsx";

const TABS = [
  { id: "rendite",        label: "Rendite & IRR" },
  { id: "cashflow",       label: "Cashflow" },
  { id: "risiko",         label: "Risiko" },
  { id: "sensitivitaet",  label: "Sensitivitäten" },
  { id: "bank",           label: "Bankgespräch" },
  { id: "checkliste",     label: "Checkliste" },
  { id: "szenarien",      label: "Szenarien" },
];

const MIN_W = 240;
const MAX_W = 640;
const DEFAULT_W = 288;

export default function App() {
  const { user } = useAuth();
  const { inputs, update, loadScenario, result, beKm, beZ1, loading, error } = useCalculator();
  const { scenarios, save, remove } = useScenarios(user);
  const [tab, setTab] = useState("rendite");

  // ── draggable sidebar ──────────────────────────────────────────────────────
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_W);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const onDragStart = useCallback(e => {
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = sidebarWidth;
    e.preventDefault();
  }, [sidebarWidth]);

  useEffect(() => {
    const onMove = e => {
      if (!dragging.current) return;
      // drag handle is on LEFT edge of right sidebar → drag left = wider
      const delta = startX.current - e.clientX;
      setSidebarWidth(Math.max(MIN_W, Math.min(MAX_W, startW.current + delta)));
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Main area (left) */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Tab bar */}
        <nav className="bg-white border-b border-gray-200 px-4 flex items-end shrink-0 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap -mb-px ${
                tab === t.id
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
          {loading && (
            <span className="ml-auto mb-3 mr-2 text-xs text-gray-400 animate-pulse shrink-0">Berechnet…</span>
          )}
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              Fehler: {error}
            </div>
          )}
          <ErrorBoundary key={tab}>
            {tab === "rendite"       && <TabRendite       result={result} inputs={inputs} loading={loading} />}
            {tab === "cashflow"      && <TabCashflow      result={result} inputs={inputs} loading={loading} />}
            {tab === "risiko"        && <TabRisiko        result={result} inputs={inputs} beKm={beKm} beZ1={beZ1} loading={loading} />}
            {tab === "sensitivitaet" && <TabSensitivitaet result={result} inputs={inputs} loading={loading} />}
            {tab === "bank"          && <TabBank          result={result} inputs={inputs} />}
            {tab === "checkliste"    && <TabCheckliste />}
            {tab === "szenarien"     && <TabSzenarien     scenarios={scenarios} inputs={inputs} onLoad={loadScenario} onSave={save} onDelete={remove} />}
          </ErrorBoundary>
        </main>
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={onDragStart}
        className="w-1.5 shrink-0 bg-gray-200 hover:bg-green-400 cursor-col-resize transition-colors active:bg-green-500"
        title="Ziehen zum Vergrößern"
      />

      {/* Right sidebar */}
      <aside
        style={{ width: sidebarWidth }}
        className="shrink-0 bg-white border-l border-gray-200 h-screen overflow-y-auto flex flex-col"
      >
        <Sidebar inputs={inputs} update={update} />
      </aside>
    </div>
  );
}

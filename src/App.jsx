import { useState } from "react";
import { useAuth } from "./useAuth.js";
import { useCalculator } from "./useCalculator.js";
import { useScenarios } from "./useScenarios.js";
import Sidebar from "./components/Sidebar.jsx";
import TabCashflow from "./components/tabs/Cashflow.jsx";
import TabRendite from "./components/tabs/Rendite.jsx";
import TabRisiko from "./components/tabs/Risiko.jsx";
import TabBank from "./components/tabs/Bankgespraech.jsx";
import TabSzenarien from "./components/tabs/SzenarienSpeichern.jsx";

const TABS = [
  { id: "cashflow",  label: "Cashflow" },
  { id: "rendite",   label: "Rendite & IRR" },
  { id: "risiko",    label: "Risiko" },
  { id: "bank",      label: "Bankgespräch" },
  { id: "szenarien", label: "💾 Szenarien" },
];

export default function App() {
  const { user } = useAuth();
  const { inputs, update, loadScenario, result, beKm, beZ1, loading, error } = useCalculator();
  const { scenarios, save, remove } = useScenarios(user);
  const [tab, setTab] = useState("cashflow");

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar inputs={inputs} update={update} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Tab bar */}
        <nav className="bg-white border-b border-gray-200 px-6 flex items-end shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap -mb-px ${
                tab === t.id
                  ? "border-brand-500 text-brand-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
          {loading && (
            <span className="ml-auto mb-3 text-xs text-gray-400 animate-pulse">Berechnet…</span>
          )}
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              Fehler: {error}
            </div>
          )}
          {tab === "cashflow"  && <TabCashflow  result={result} inputs={inputs} loading={loading} />}
          {tab === "rendite"   && <TabRendite   result={result} inputs={inputs} loading={loading} />}
          {tab === "risiko"    && <TabRisiko    result={result} inputs={inputs} beKm={beKm} beZ1={beZ1} loading={loading} />}
          {tab === "bank"      && <TabBank      result={result} inputs={inputs} />}
          {tab === "szenarien" && <TabSzenarien scenarios={scenarios} inputs={inputs} onLoad={loadScenario} onSave={save} onDelete={remove} />}
        </main>
      </div>
    </div>
  );
}

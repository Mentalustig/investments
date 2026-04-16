import { useState } from "react";
import { fe, fp } from "../../fmt.js";

export default function SzenarienSpeichern({ scenarios, inputs, onLoad, onSave, onDelete }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), inputs.adr, inputs);
    setName("");
    setSaving(false);
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      {/* Save */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-green-700 mb-4">Aktuelles Szenario speichern</h2>
        <p className="text-sm text-gray-500 mb-3">
          {inputs.adr} — {fe(inputs.kp)} — Miete {fe(inputs.km)}/M — Zins {fp(inputs.z1)}
        </p>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            placeholder="Name (z.B. Düsseldorf Szenario A)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
          />
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-40 hover:bg-green-800 transition-colors whitespace-nowrap"
          >
            {saving ? "…" : "Speichern"}
          </button>
        </div>
      </div>

      {/* List */}
      {scenarios.length === 0 ? (
        <p className="text-sm text-gray-400">Noch keine gespeicherten Szenarien.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-green-700">Gespeicherte Szenarien ({scenarios.length})</h2>
          {scenarios.map(sc => (
            <div key={sc.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-900">{sc.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sc.address} · {new Date(sc.updated_at).toLocaleDateString("de-DE")}</p>
                <p className="text-xs text-gray-400 mt-0.5">KP {fe(sc.inputs.kp)} · Miete {fe(sc.inputs.km)}/M · Zins {fp(sc.inputs.z1)}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => onLoad(sc.inputs)} className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors">Laden</button>
                <button onClick={() => onDelete(sc.id)} className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors">Löschen</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

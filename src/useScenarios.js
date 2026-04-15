import { useState, useEffect, useCallback } from "react";

export function useScenarios(user) {
  const [scenarios, setScenarios] = useState([]);

  const load = useCallback(async () => {
    if (!user) return;
    const r = await fetch("/api/scenarios");
    if (r.ok) { const d = await r.json(); setScenarios(d.scenarios || []); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const save = async (name, address, inputs) => {
    const r = await fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, address, inputs }),
    });
    if (r.ok) load();
  };

  const update = async (id, name, address, inputs) => {
    await fetch(`/api/scenarios?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, address, inputs }),
    });
    load();
  };

  const remove = async (id) => {
    await fetch(`/api/scenarios?id=${id}`, { method: "DELETE" });
    load();
  };

  return { scenarios, save, update, remove, reload: load };
}

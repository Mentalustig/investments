import { useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { fe, fp, color } from "../../fmt.js";
import InfoBox from "../ui/InfoBox.jsx";

async function apiCall(action, params) {
  const r = await fetch("/api/calculate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, params }) });
  return r.json();
}

export default function Szenarien({ result, inputs }) {
  const [tornado, setTornado] = useState(null);
  const [beKm, setBeKm] = useState(null);
  const [beZ1, setBeZ1] = useState(null);
  const [sens, setSens] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!inputs) return;
    const t = setTimeout(async () => {
      setLoading(true);
      const [t, bk, bz] = await Promise.all([
        apiCall("tornado", inputs),
        apiCall("breakeven_km", inputs),
        apiCall("breakeven_z1", inputs),
      ]);
      setTornado(t.items);
      setBeKm(bk.value);
      setBeZ1(bz.value);
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [inputs]);

  async function loadSensitivity() {
    setLoading(true);
    const r = await apiCall("sensitivity", inputs);
    setSens(r.rows);
    setLoading(false);
  }

  if (!result) return null;
  const { s } = result;

  const pufferKm = beKm ? (inputs.km - beKm) / inputs.km : null;
  const pufferZ1 = beZ1 ? beZ1 - inputs.z1 : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Breakeven */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { title: "Breakeven Kaltmiete", current: fe(inputs.km), be: beKm ? fe(beKm) : "—", puffer: pufferKm, suffix: "/M" },
          { title: "Breakeven Zinssatz", current: fp(inputs.z1), be: beZ1 ? fp(beZ1) : "—", puffer: pufferZ1, suffix: "" },
        ].map(({ title, current, be, puffer }) => (
          <div key={title} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 18, boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 14 }}>{title}</div>
            {[["Dein Wert", current], ["Breakeven", be], ["Puffer", puffer !== null ? (title.includes("Miete") ? fe(inputs.km - (beKm ?? 0)) : fp(pufferZ1 ?? 0)) : "—"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--bg-subtle)", fontSize: "0.87rem" }}>
                <span style={{ color: "var(--text-2)" }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            {puffer !== null && (
              <div style={{ marginTop: 10 }}>
                {puffer > 0.15 ? <InfoBox type="success">Guter Puffer ({fp(puffer)})</InfoBox>
                  : puffer > 0 ? <InfoBox type="warning">Knapper Puffer ({fp(puffer)})</InfoBox>
                  : <InfoBox type="error">Unter Breakeven</InfoBox>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tornado */}
      {tornado && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 18, boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Sensitivität — Δ CF netto / Monat</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={tornado.slice(0, 10).map(([n, v]) => ({ name: n, value: v }))} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-2)" }} tickFormatter={v => `${v > 0 ? "+" : ""}${v.toFixed(0)} €`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--text-2)" }} width={110} />
              <Tooltip formatter={v => fe(v)} contentStyle={{ background: "var(--dark)", border: "none", borderRadius: 6, color: "#fff", fontSize: 12 }} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} label={{ position: "right", fontSize: 10, fill: "var(--text-2)", formatter: v => `${v > 0 ? "+" : ""}${v.toFixed(0)} €` }}>
                {tornado.slice(0, 10).map(([, v], i) => <Cell key={i} fill={v >= 0 ? "#4a7c4a" : "#c0392b"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sensitivity table */}
      <div>
        {!sens ? (
          <button onClick={loadSensitivity} disabled={loading} style={{ background: "var(--green-500)", color: "#fff", border: "none", borderRadius: "var(--r-md)", padding: "10px 20px", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Berechne…" : "Sensitivitätstabelle laden"}
          </button>
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 18, boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 12 }}>Vollständige Sensitivitätstabelle</div>
            <div style={{ overflowX: "auto", maxHeight: 480, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
                <thead style={{ position: "sticky", top: 0, background: "var(--bg-subtle)" }}>
                  <tr>
                    {["Parameter", "Wert", "CF/M", "Δ CF", "Verm. 10J", "Δ Verm."].map(h => (
                      <th key={h} style={{ padding: "7px 10px", textAlign: h === "Parameter" || h === "Wert" ? "left" : "right", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sens.map((row, i) => (
                    <tr key={i} style={{ background: row.isCurrent ? "var(--green-100)" : i % 2 === 0 ? "var(--surface)" : "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "5px 10px", color: "var(--text-2)" }}>{row.param}</td>
                      <td style={{ padding: "5px 10px", fontWeight: row.isCurrent ? 700 : 400 }}>{row.value} {row.isCurrent ? "◄" : ""}</td>
                      <td style={{ padding: "5px 10px", textAlign: "right", color: row.cfm >= 0 ? "var(--positive)" : "var(--negative)", fontWeight: 600 }}>{fe(row.cfm)}</td>
                      <td style={{ padding: "5px 10px", textAlign: "right", color: row.deltaCf >= 0 ? "var(--positive)" : "var(--negative)" }}>{row.deltaCf >= 0 ? "+" : ""}{fe(row.deltaCf)}</td>
                      <td style={{ padding: "5px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fe(row.verm10)}</td>
                      <td style={{ padding: "5px 10px", textAlign: "right", color: row.deltaVerm >= 0 ? "var(--positive)" : "var(--negative)" }}>{row.deltaVerm >= 0 ? "+" : ""}{fe(row.deltaVerm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

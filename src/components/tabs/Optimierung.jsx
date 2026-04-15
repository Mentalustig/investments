import { useState, useEffect } from "react";
import { fe, fp } from "../../fmt.js";

async function apiCall(action, params) {
  const r = await fetch("/api/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params }),
  });
  return r.json();
}

// Color for cashflow cells
function cfColor(v, min, max) {
  if (v == null) return "#eee";
  if (v >= 0) {
    const t = max > 0 ? Math.min(v / max, 1) : 0;
    const g = Math.round(100 + t * 80);
    return `rgb(${Math.round(240 - t * 60)}, ${g + 40}, ${Math.round(240 - t * 60)})`;
  } else {
    const t = min < 0 ? Math.min(-v / -min, 1) : 0;
    return `rgb(${Math.round(240 + t * 15)}, ${Math.round(200 - t * 80)}, ${Math.round(200 - t * 80)})`;
  }
}

function Matrix2D({ matrix, rowLabels, colLabels, currentRow, currentCol, formatter }) {
  if (!matrix) return null;
  const allVals = matrix.flat().filter(v => v != null);
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", fontSize: "0.8rem", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ padding: "6px 10px", fontSize: "0.68rem", color: "var(--text-3)", textAlign: "left" }}>Zins↓ / Miete→</th>
            {colLabels.map((v, j) => (
              <th key={j} style={{ padding: "6px 8px", textAlign: "center", fontWeight: j === currentCol ? 800 : 500, color: j === currentCol ? "var(--green-700)" : "var(--text-2)", fontSize: "0.72rem", background: j === currentCol ? "var(--green-100)" : "transparent" }}>
                {typeof v === "number" ? `${Math.round(v)}€` : v}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td style={{ padding: "5px 10px", fontWeight: i === currentRow ? 800 : 500, color: i === currentRow ? "var(--green-700)" : "var(--text-2)", fontSize: "0.72rem", background: i === currentRow ? "var(--green-100)" : "transparent", whiteSpace: "nowrap" }}>
                {typeof rowLabels[i] === "number" ? fp(rowLabels[i]) : rowLabels[i]}
              </td>
              {row.map((v, j) => {
                const isCurrent = i === currentRow && j === currentCol;
                return (
                  <td key={j} style={{
                    padding: "5px 8px", textAlign: "center",
                    background: isCurrent ? "#fff" : cfColor(v, minV, maxV),
                    border: isCurrent ? "2px solid var(--green-600)" : "1px solid #ddd",
                    fontWeight: isCurrent ? 800 : 400,
                    color: isCurrent ? "var(--green-800)" : (v >= 0 ? "#1a4a1a" : "#800000"),
                    fontVariantNumeric: "tabular-nums",
                    fontSize: "0.78rem",
                  }}>
                    {v != null ? formatter(v) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Optimierung({ result, inputs }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("cf"); // cf or ek

  useEffect(() => {
    if (!inputs) return;
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await apiCall("sensitivity_2d", inputs);
      setData(r);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [inputs]);

  if (!result) return null;
  const { s } = result;

  const currentZ1Idx = data ? data.z1Steps.findIndex(v => Math.abs(v - inputs.z1) < 0.001) : -1;
  const currentKmIdx = data ? data.kmSteps.findIndex(v => Math.abs(v - inputs.km) < 1) : -1;

  // Optimization tips
  const tips = [];
  if (s.cfn < 0) tips.push({ icon: "💡", text: `Miete ${fe(-s.cfn / 0.65)} höher → Breakeven (ca.)` });
  if (s.dg / inputs.kp > 0.8) tips.push({ icon: "💡", text: `Mehr EK einsetzen → LTV unter 80% für bessere Konditionen` });
  if (s.gst > 0.35 && s.afm > 0) tips.push({ icon: "💡", text: `AfA spart ${fe(s.gst * s.afm)}/M Steuern — Gebäudeanteil prüfen` });
  if (inputs.ihq < 8) tips.push({ icon: "⚠️", text: `IH-Rücklage unter 8 €/m²/J — Risiko für ungeplante Erneuerungen` });
  if (s.cfn >= 0) tips.push({ icon: "✅", text: `Positiver Cashflow — Objekt selbsttragend` });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Tips ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px 20px", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 10 }}>Optimierungshinweise</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tips.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: "0.88rem" }}>
              <span>{t.icon}</span>
              <span style={{ color: "var(--text-1)" }}>{t.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sensitivity Matrix ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "18px 20px", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase" }}>Sensitivitäts-Matrix: Zins × Kaltmiete</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: 2 }}>Markiertes Feld = aktuelle Eingabe. Grün = positiv, Rot = negativ.</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setMode("cf")} style={{ background: mode === "cf" ? "var(--green-500)" : "var(--bg-subtle)", color: mode === "cf" ? "#fff" : "var(--text-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "5px 12px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>CF/Monat</button>
            <button onClick={() => setMode("ek")} style={{ background: mode === "ek" ? "var(--green-500)" : "var(--bg-subtle)", color: mode === "ek" ? "#fff" : "var(--text-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "5px 12px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>EK-Rendite</button>
          </div>
        </div>

        {loading && <div style={{ color: "var(--text-3)", fontSize: "0.88rem", padding: "20px 0" }}>Berechne Matrix…</div>}

        {data && !loading && (
          <Matrix2D
            matrix={mode === "cf" ? data.cfMatrix : data.ekMatrix}
            rowLabels={data.z1Steps}
            colLabels={data.kmSteps}
            currentRow={currentZ1Idx >= 0 ? currentZ1Idx : Math.floor(data.z1Steps.length / 2)}
            currentCol={currentKmIdx >= 0 ? currentKmIdx : Math.floor(data.kmSteps.length / 2)}
            formatter={mode === "cf" ? (v => `${v >= 0 ? "+" : ""}${Math.round(v)}€`) : (v => fp(v))}
          />
        )}
      </div>

      {/* ── Stellschrauben ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "18px 20px", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 12 }}>Was bringen Veränderungen? (Δ CF/Monat)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            ["Miete +50 €/M", 50 / (1 - s.gst)],
            ["Miete −50 €/M", -50 / (1 - s.gst)],
            ["Zins −0,5 %", (inputs.z1 * inputs.kp * inputs.d1p * 0.005) / 12],
            ["Zins +0,5 %", -(inputs.z1 * inputs.kp * inputs.d1p * 0.005) / 12],
            ["Mehr EK +20k", (0.02 * 20000) / 12],
            ["Kaufpreis −10k", (inputs.z1 * inputs.d1p * 10000) / 12],
          ].map(([label, delta]) => (
            <div key={label} style={{ background: delta >= 0 ? "#f0faf0" : "#fff0f0", border: `1px solid ${delta >= 0 ? "#b8ddb8" : "#f0b8b8"}`, borderRadius: "var(--r-sm)", padding: "10px 14px" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-3)", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: delta >= 0 ? "#2d6a2d" : "#c0392b" }}>
                {delta >= 0 ? "+" : ""}{Math.round(delta)} €/M
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "0.68rem", color: "var(--text-3)", marginTop: 8 }}>* Näherungswerte, ohne Steuereffekte</div>
      </div>
    </div>
  );
}

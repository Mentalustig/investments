import { fe, fp } from "../../fmt.js";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const customTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--dark)", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#fff" }}>
      <div style={{ marginBottom: 4, fontWeight: 600 }}>Jahr {label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {fe(p.value)}</div>
      ))}
    </div>
  );
};

export default function Rendite({ result, inputs }) {
  if (!result) return <div style={{ color: "var(--text-3)", padding: 40, textAlign: "center" }}>Wird berechnet…</div>;
  const { df, s } = result;

  // ETF comparison: same EK at 7% p.a.
  const etfData = df.slice(0, 30).map((r, i) => ({
    year: r.jr,
    "Nettovermögen Immobilie": Math.round(r.tot),
    "ETF 7% p.a.": Math.round(s.ek * Math.pow(1.07, i + 1)),
    "Marktwert Immobilie": Math.round(r.w),
    "Restschuld": Math.round(r.rs),
  }));

  // Milestones
  const yr10 = df[9], yr20 = df[19], yr30 = df[29];

  const metrics = [
    { label: "EK-Rendite (Jahr 1)", value: fp(s.ekr), hint: "inkl. Tilgung + Wertsteigerung" },
    { label: "Nettomietrendite", value: fp(s.nmr), hint: "(Miete − Kosten) / Gesamtinvestition" },
    { label: "Bruttomietrendite", value: fp(s.br), hint: "Jahresmiete / Kaufpreis" },
    { label: "Steuerersparnis/M", value: fe(s.gst * s.afm), hint: `durch AfA ${fe(s.afm)}/M` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Rendite KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {metrics.map(({ label, value, hint }) => (
          <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px 18px", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--green-700)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-3)", marginTop: 4 }}>{hint}</div>
          </div>
        ))}
      </div>

      {/* ── Vermögensaufbau Chart ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "18px 20px", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 4 }}>Nettovermögen über 30 Jahre</div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-3)", marginBottom: 12 }}>
          Immobilie vs. ETF (7% p.a.) mit gleichem Eigenkapitaleinsatz ({(s.ek / 1000).toFixed(0)}k €)
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={etfData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--text-2)" }} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-2)" }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={customTooltip} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Nettovermögen Immobilie" stroke="#2d6a2d" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="ETF 7% p.a." stroke="#2c5f8a" strokeWidth={2} dot={false} strokeDasharray="6 3" />
            <Line type="monotone" dataKey="Marktwert Immobilie" stroke="#7a9a7a" strokeWidth={1} dot={false} strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Milestones ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "18px 20px", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 12 }}>Vermögensübersicht nach Zeithorizont</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
          <thead>
            <tr style={{ background: "var(--bg-subtle)" }}>
              {["", "Jahr 10", "Jahr 20", "Jahr 30"].map(h => (
                <th key={h} style={{ padding: "7px 12px", textAlign: h === "" ? "left" : "right", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["Marktwert", r => fe(r.w)],
              ["Restschuld", r => fe(r.rs)],
              ["Eigenkapital (Immobilie)", r => fe(r.nv)],
              ["Kumulierter CF", r => fe(r.kcf)],
              ["Nettovermögen gesamt", r => fe(r.tot)],
              ["ETF-Vergleich (7%)", (r, i) => fe(s.ek * Math.pow(1.07, (i + 1) * 10))],
            ].map(([label, fn]) => (
              <tr key={label} style={{ borderBottom: "1px solid var(--bg-subtle)" }}>
                <td style={{ padding: "7px 12px", color: "var(--text-2)", fontWeight: label.startsWith("Netto") ? 700 : 400 }}>{label}</td>
                {[yr10, yr20, yr30].map((r, i) => (
                  <td key={i} style={{ padding: "7px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: label.startsWith("Netto") ? 700 : 400, color: label.startsWith("Netto") ? "var(--green-700)" : "inherit" }}>
                    {r ? fn(r, i) : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── AfA & Steuer ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px 18px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 10 }}>AfA — Steuerersparnis</div>
          {[
            ["AfA-Satz", fp(s.afs)],
            ["AfA-Basis", fe(s.afb)],
            ["AfA / Jahr", fe(s.afp)],
            ["AfA / Monat", fe(s.afm)],
            ["Grenzsteuersatz", fp(s.gst)],
            ["Steuerersparnis / Monat", fe(s.gst * s.afm)],
            ["Steuerlicher CF / Monat", fe(s.stm > 0 ? -s.stm : s.gst * (s.afm - s.zm))],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--bg-subtle)", fontSize: "0.84rem" }}>
              <span style={{ color: "var(--text-2)" }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px 18px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 10 }}>Investitionsstruktur</div>
          {[
            ["Kaufpreis", fe(inputs.kp)],
            ["Kaufnebenkosten", fe(s.nk)],
            ["Anfangsinvestition", fe(inputs.inv)],
            ["Gesamtinvestition", fe(s.gi)],
            ["Fremdkapital", fe(s.dg)],
            ["Eigenkapital", fe(s.ek)],
            ["LTV (Beleihungsquote)", fp(s.dg / inputs.kp)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--bg-subtle)", fontSize: "0.84rem" }}>
              <span style={{ color: "var(--text-2)" }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

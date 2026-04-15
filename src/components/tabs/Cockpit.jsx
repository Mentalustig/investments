import KpiCard from "../ui/KpiCard.jsx";
import InfoBox from "../ui/InfoBox.jsx";
import { fe, fp, color } from "../../fmt.js";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const G = ["#1a2e1a","#4a7c4a","#7aad7a","#d4e8d4"];

function MiniPie({ data, title }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{title}</div>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={68} dataKey="value" paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={G[i % G.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => fe(v)} contentStyle={{ background: "var(--dark)", border: "none", borderRadius: 6, color: "#fff", fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 4 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.73rem", color: "var(--text-2)" }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: G[i % G.length] }} />
            {d.name}: <b style={{ color: "var(--text)" }}>{fe(d.value)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function CashflowBar({ s }) {
  const data = [
    { name: "Warmmiete", value: s.wm, fill: "#4a7c4a" },
    { name: "BWK", value: -s.bg, fill: "#c0392b" },
    { name: "Zinsen", value: -s.zm, fill: "#b7791f" },
    { name: "Tilgung", value: -s.tm, fill: "#2c5f8a" },
    { name: "Steuern", value: -s.stm, fill: "#7a7a7a" },
    { name: "CF netto", value: s.cfn, fill: s.cfn >= 0 ? "#4a7c4a" : "#c0392b" },
  ];
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Cashflow / Monat</div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-2)" }} />
          <YAxis tick={{ fontSize: 10, fill: "var(--text-2)" }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
          <Tooltip formatter={v => fe(v)} contentStyle={{ background: "var(--dark)", border: "none", borderRadius: 6, color: "#fff", fontSize: 12 }} />
          <Bar dataKey="value" radius={[3,3,0,0]}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Cockpit({ result, inputs }) {
  if (!result) return null;
  const { s, df } = result;

  const investData = [
    { name: "Kaufpreis", value: inputs.kp },
    { name: "Nebenkosten", value: s.nk },
    ...(inputs.inv > 0 ? [{ name: "Investitionen", value: inputs.inv }] : []),
  ];
  const finanzData = [
    { name: "Darlehen I", value: s.d1 },
    ...(inputs.d2s > 0 ? [{ name: "Darlehen II", value: inputs.d2s }] : []),
    { name: "Eigenkapital", value: s.ek },
  ];

  const zfest = inputs.zfest ?? 10;
  const rsZf = df[zfest - 1]?.rs;
  const stressRate = rsZf ? (0.05 + inputs.t1) * rsZf / 12 : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
        <KpiCard label="CF netto / Monat" value={fe(s.cfn)} valueColor={color(s.cfn)}
          delta={s.cfn >= 0 ? "▲ positiv" : "▼ negativ"} deltaColor={color(s.cfn)} />
        <KpiCard label="Eigenkapital" value={fe(s.ek)} />
        <KpiCard label="Brutto-Rendite" value={fp(s.br)} valueColor={s.br >= 0.04 ? "var(--positive)" : "var(--negative)"}
          delta={s.br >= 0.04 ? "≥ 4% Ziel" : "< 4% Ziel"} deltaColor={s.br >= 0.04 ? "var(--positive)" : "var(--negative)"} />
        <KpiCard label="EK-Rendite p.a." value={fp(s.ekr)} valueColor={color(s.ekr)} />
        <KpiCard label="CF+ ab Jahr" value={s.cfpy ?? "nie"} />
        <KpiCard label="Schuldenfrei" value={s.vtj ?? ">60J"} />
      </div>

      {/* Mini Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <MiniPie data={investData} title="Gesamtinvestition" />
        <MiniPie data={finanzData} title="Finanzierungsstruktur" />
        <CashflowBar s={s} />
      </div>

      {/* Kennzahlen Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 18, boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--green-700)", marginBottom: 12 }}>INVESTITION & FINANZIERUNG</div>
          {[
            ["Kaufpreis", fe(inputs.kp)],
            ["Nebenkosten", `${fe(s.nk)} (${fp(s.nk / inputs.kp)})`],
            ["Gesamtinvestition", fe(s.gi)],
            ["Eigenkapital", fe(s.ek)],
            ["Darlehen gesamt", fe(s.dg)],
            ["Rate / Monat", fe(s.rm)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--bg-subtle)", fontSize: "0.87rem" }}>
              <span style={{ color: "var(--text-2)" }}>{k}</span>
              <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 18, boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--green-700)", marginBottom: 12 }}>MONATLICHER CASHFLOW</div>
          {[
            ["Warmmiete", fe(s.wm), null],
            ["Bewirtschaftungskosten", `-${fe(s.bg)}`, "var(--negative)"],
            ["davon Zinsen", `-${fe(s.zm)}`, null],
            ["davon Tilgung", `-${fe(s.tm)}`, null],
            ["CF operativ", fe(s.cfop), color(s.cfop)],
            ["Steuern", fe(-s.stm), null],
            ["CF nach Steuern", fe(s.cfn), color(s.cfn)],
          ].map(([k, v, c]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--bg-subtle)", fontSize: "0.87rem" }}>
              <span style={{ color: "var(--text-2)" }}>{k}</span>
              <span style={{ fontWeight: k.includes("CF") ? 700 : 600, color: c || "var(--text)", fontVariantNumeric: "tabular-nums" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Future values table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 18, boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--green-700)", marginBottom: 12 }}>KENNZAHLEN IN DER ZUKUNFT</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "var(--bg-subtle)" }}>
                <th style={{ padding: "6px 10px", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase" }}>Kennzahl</th>
                {[1, 5, 10, 15, 20, 30].map(y => <th key={y} style={{ padding: "6px 10px", textAlign: "right", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase" }}>{y}J</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ["CF netto/M", y => fe(df[y-1]?.cn ?? 0), y => df[y-1]?.cn],
                ["Netto-Vermögen", y => fe(df[y-1]?.nv ?? 0), null],
                ["Immobilienwert", y => fe(df[y-1]?.w ?? 0), null],
                ["Restschuld", y => fe(df[y-1]?.rs ?? 0), null],
              ].map(([label, fmt, colorFn]) => (
                <tr key={label} style={{ borderBottom: "1px solid var(--bg-subtle)" }}>
                  <td style={{ padding: "7px 10px", color: "var(--text-2)" }}>{label}</td>
                  {[1, 5, 10, 15, 20, 30].map(y => (
                    <td key={y} style={{ padding: "7px 10px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: colorFn ? color(df[y-1]?.[colorFn] ?? 0) : "var(--text)" }}>
                      {fmt(y)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info boxes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <InfoBox>
          <b>AfA-Steuerersparnis:</b> {fe(s.gst * s.afm)}/M ({fe(s.gst * s.afm * 12)}/J) · Grenzsteuersatz: {fp(s.gst)} · AfA-Basis: {fe(s.afb)} @ {fp(s.afs)}
        </InfoBox>
        {stressRate && rsZf > 0 && (
          <InfoBox type="warning">
            Nach {zfest}J Zinsbindung: Restschuld <b>{fe(rsZf)}</b> · Bei 5% Anschluss: <b>{fe(stressRate)}/M</b> Rate
          </InfoBox>
        )}
      </div>
    </div>
  );
}

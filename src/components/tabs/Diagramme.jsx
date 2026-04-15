import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, Area } from "recharts";
import { fe } from "../../fmt.js";

const TT = { contentStyle: { background: "var(--dark)", border: "none", borderRadius: 6, color: "#fff", fontSize: 12 }, formatter: (v) => fe(v) };
const AXIS = { tick: { fontSize: 11, fill: "var(--text-2)" } };

function ChartCard({ title, children, height = 280 }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px 18px", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{title}</div>
      <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>
    </div>
  );
}

export default function Diagramme({ result }) {
  if (!result) return null;
  const { df } = result;
  const d50 = df.slice(0, 50);
  const d30 = df.slice(0, 30);
  const d40 = df.slice(0, 40);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Row 1: Cashflow bars */}
      <ChartCard title="Cashflow-Entwicklung (monatlich netto, kumuliert)" height={300}>
        <ComposedChart data={d30} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="jr" {...AXIS} />
          <YAxis yAxisId="l" {...AXIS} tickFormatter={v => `${(v).toFixed(0)} €`} width={72} />
          <YAxis yAxisId="r" orientation="right" {...AXIS} tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={52} />
          <Tooltip {...TT} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="l" dataKey="cn" name="CF/M" radius={[3,3,0,0]}
            fill="#4a7c4a"
            label={false} />
          <Line yAxisId="r" type="monotone" dataKey="kcf" name="Kumuliert" stroke="#2c5f8a" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ChartCard>

      {/* Row 2: Restschuld + Zins/Tilgung */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <ChartCard title="Darlehens-Restschuld">
          <BarChart data={d50} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="jr" {...AXIS} interval={9} />
            <YAxis {...AXIS} tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={50} />
            <Tooltip {...TT} />
            <Bar dataKey="rs" name="Restschuld" fill="#1a2e1a" radius={[2,2,0,0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Zins- und Tilgungsentwicklung">
          <BarChart data={d40} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="jr" {...AXIS} interval={7} />
            <YAxis {...AXIS} tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={50} />
            <Tooltip {...TT} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="zi" name="Zinsen" stackId="a" fill="#c0392b" radius={[0,0,0,0]} />
            <Bar dataKey="ti" name="Tilgung" stackId="a" fill="#4a7c4a" radius={[2,2,0,0]} />
          </BarChart>
        </ChartCard>
      </div>

      {/* Row 3: Wert/Vermögen + Kumulierter Zins */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <ChartCard title="Wert und Netto-Vermögen" height={300}>
          <ComposedChart data={d40} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="jr" {...AXIS} interval={7} />
            <YAxis {...AXIS} tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={55} />
            <Tooltip {...TT} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="w" name="Immobilienwert" fill="#1a2e1a" opacity={0.85} radius={[2,2,0,0]} />
            <Line type="monotone" dataKey="nv" name="Netto-Vermögen" stroke="#4a7c4a" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ChartCard>

        <ChartCard title="Kumulierter Zinsaufwand" height={300}>
          <BarChart data={d50} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="jr" {...AXIS} interval={9} />
            <YAxis {...AXIS} tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={55} />
            <Tooltip {...TT} />
            <Bar dataKey="kz" name="Kum. Zinsaufwand" fill="#c0392b" opacity={0.85} radius={[2,2,0,0]} />
          </BarChart>
        </ChartCard>
      </div>
    </div>
  );
}

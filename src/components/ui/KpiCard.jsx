const S = {
  card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 18px", boxShadow: "var(--shadow-sm)" },
  label: { fontSize: "0.7rem", fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 },
  value: { fontSize: "1.45rem", fontWeight: 700, fontVariantNumeric: "tabular-nums", lineHeight: 1.2 },
  delta: { fontSize: "0.78rem", marginTop: 4, fontWeight: 500 },
};

export default function KpiCard({ label, value, delta, deltaColor, valueColor }) {
  return (
    <div style={S.card}>
      <div style={S.label}>{label}</div>
      <div style={{ ...S.value, color: valueColor || "var(--text)" }}>{value}</div>
      {delta && <div style={{ ...S.delta, color: deltaColor || "var(--text-2)" }}>{delta}</div>}
    </div>
  );
}

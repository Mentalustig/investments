import { fe, fp } from "../../fmt.js";

export default function Details({ result, inputs }) {
  if (!result) return null;
  const { df, s } = result;

  const csvData = df.map(r => Object.entries(r).map(([, v]) => typeof v === "number" ? v.toFixed(2) : v).join(","));
  const csvContent = "jr,j,mi,wi,bi,rm,co,st,cn,cj,zi,ti,rs,w,nv,af,kcf,kz,tot\n" + csvData.join("\n");
  const csvBlob = new Blob([csvContent], { type: "text/csv" });
  const csvUrl = URL.createObjectURL(csvBlob);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Tilgungsplan */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 18, boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase" }}>Tilgungsplan (40 Jahre)</div>
          <a href={csvUrl} download={`kalkulation_${(inputs.adr || "objekt").replace(/\s+/g, "_")}.csv`}
            style={{ background: "var(--green-500)", color: "#fff", border: "none", borderRadius: "var(--r-sm)", padding: "6px 14px", fontWeight: 600, fontSize: "0.8rem", textDecoration: "none" }}>
            CSV Export
          </a>
        </div>
        <div style={{ overflowX: "auto", maxHeight: 440, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", whiteSpace: "nowrap" }}>
            <thead style={{ position: "sticky", top: 0, background: "var(--bg-subtle)" }}>
              <tr>
                {["Jahr","J","Miete/M","Warmm./M","BWK/M","Rate/M","CF op/M","Steuer/M","CF nSt/M","Restschuld","Wert","Netto-Verm."].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: h === "Jahr" || h === "J" ? "left" : "right", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {df.slice(0, 40).map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "var(--surface)" : "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "5px 10px" }}>{r.jr}</td>
                  <td style={{ padding: "5px 10px", color: "var(--text-2)" }}>{r.j}</td>
                  {[r.mi, r.wi, r.bi, r.rm, r.co, r.st, r.cn, r.rs, r.w, r.nv].map((v, j) => (
                    <td key={j} style={{ padding: "5px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: j === 6 ? (v >= 0 ? "var(--positive)" : "var(--negative)") : "inherit", fontWeight: j === 6 ? 700 : 400 }}>
                      {fe(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Steuer & AfA */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 18, boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 12 }}>Steuer & AfA</div>
          {[
            ["Grenzsteuersatz", fp(s.gst)],
            ["AfA-Satz", fp(s.afs)],
            ["AfA-Basis", fe(s.afb)],
            ["AfA / Jahr", fe(s.afp)],
            ["AfA / Monat", fe(s.afm)],
            ["Steuerersparnis / M", fe(s.gst * s.afm)],
            ["Steuerlicher CF / M", fe(s.stm)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--bg-subtle)", fontSize: "0.87rem" }}>
              <span style={{ color: "var(--text-2)" }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 18, boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", marginBottom: 12 }}>Kaufnebenkosten</div>
          {[
            ["Grunderwerbsteuer", `${fp(s.gr)} = ${fe(s.gr * inputs.kp)}`],
            ["Makler", `${fp(inputs.mk)} = ${fe(inputs.mk * inputs.kp)}`],
            ["Notar", `${fp(inputs.no)} = ${fe(inputs.no * inputs.kp)}`],
            ["Grundbuch", `${fp(inputs.gb)} = ${fe(inputs.gb * inputs.kp)}`],
            ["Gesamt NK", `${fp(s.nk / inputs.kp)} = ${fe(s.nk)}`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--bg-subtle)", fontSize: "0.87rem" }}>
              <span style={{ color: "var(--text-2)" }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: "0.78rem", color: "var(--text-3)", textAlign: "center" }}>
        ⚠️ Keine Gewähr. Kein Ersatz für Finanz-, Steuer- oder Rechtsberatung.
      </p>
    </div>
  );
}

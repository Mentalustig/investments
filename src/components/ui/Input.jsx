const S = {
  wrap: { display: "flex", flexDirection: "column", gap: 3 },
  label: { fontSize: "0.72rem", fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "7px 10px", fontSize: "0.9rem", color: "var(--text)", width: "100%", outline: "none", transition: "border 150ms" },
};

export function Field({ label, children }) {
  return <div style={S.wrap}><label style={S.label}>{label}</label>{children}</div>;
}

export function NumInput({ label, value, onChange, min, max, step = 1, suffix }) {
  return (
    <Field label={label}>
      <div style={{ position: "relative" }}>
        <input type="number" style={{ ...S.input, paddingRight: suffix ? 36 : 10 }}
          value={value} min={min} max={max} step={step}
          onChange={e => onChange(Number(e.target.value))}
          onFocus={e => e.target.style.borderColor = "var(--green-500)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
        {suffix && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", fontSize: "0.8rem", pointerEvents: "none" }}>{suffix}</span>}
      </div>
    </Field>
  );
}

export function Select({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <select style={{ ...S.input, cursor: "pointer" }} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </Field>
  );
}

export function SliderInput({ label, value, onChange, min = 0, max = 100, step = 1, display }) {
  return (
    <Field label={`${label}: ${display ?? value}`}>
      <input type="range" style={{ width: "100%", accentColor: "var(--green-500)" }}
        value={value} min={min} max={max} step={step}
        onChange={e => onChange(Number(e.target.value))} />
    </Field>
  );
}

export function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => onChange(!value)}>
      <div style={{ width: 36, height: 20, borderRadius: 10, background: value ? "var(--green-500)" : "var(--border)", position: "relative", transition: "background 150ms" }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: value ? 18 : 2, transition: "left 150ms", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </div>
      <span style={{ fontSize: "0.85rem", color: "var(--text-2)" }}>{label}</span>
    </div>
  );
}

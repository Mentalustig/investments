export default function InfoBox({ children, type = "info" }) {
  const colors = {
    info:    { bg: "var(--info-bg)",   border: "var(--info)",    text: "#1a3a5c" },
    warning: { bg: "#fef3cd",          border: "var(--warning)", text: "#7c4a00" },
    success: { bg: "var(--green-100)", border: "var(--green-500)", text: "var(--green-900)" },
    error:   { bg: "#fde8e8",          border: "var(--negative)", text: "#7c0000" },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{ background: c.bg, borderLeft: `3px solid ${c.border}`, borderRadius: "var(--r-sm)", padding: "10px 14px", fontSize: "0.87rem", color: c.text, lineHeight: 1.55 }}>
      {children}
    </div>
  );
}

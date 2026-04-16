export const fe = v => {
  if (v == null) return "—";
  const s = Math.abs(v).toLocaleString("de-DE", { maximumFractionDigits: 0 });
  return v < 0 ? `-${s} €` : `${s} €`;
};
export const fp = (v, d = 1) => v == null ? "—" : `${((v) * 100).toFixed(d)} %`;
export const colorCls = v => v >= 0 ? "text-green-700" : "text-red-600";
export const bgCls = v => v >= 0
  ? "bg-green-50 border border-green-200 text-green-800"
  : "bg-red-50 border border-red-200 text-red-700";

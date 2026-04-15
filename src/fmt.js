// Formatting helpers
export const fe = v => {
  const s = Math.abs(v).toLocaleString("de-DE", { maximumFractionDigits: 0 });
  return v < 0 ? `-${s} €` : `${s} €`;
};
export const fp = v => `${(v * 100).toFixed(1)}%`;
export const fpm = v => `${(v * 100).toFixed(2)}%`;
export const color = v => v >= 0 ? "var(--positive)" : "var(--negative)";

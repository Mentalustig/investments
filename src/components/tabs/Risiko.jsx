import { fe, fp } from "../../fmt.js";

function BreakevenCard({ title, current, breakeven, puffer, pufferLabel, warning }) {
  const color = puffer > 0.15 ? "green" : puffer > 0.05 ? "amber" : "red";
  const colors = {
    green: { ring: "border-green-200 bg-green-50", bar: "bg-green-500", text: "text-green-700" },
    amber: { ring: "border-amber-200 bg-amber-50", bar: "bg-amber-400", text: "text-amber-700" },
    red:   { ring: "border-red-200 bg-red-50",     bar: "bg-red-500",   text: "text-red-700" },
  }[color];

  const pct = Math.min(Math.max(puffer, 0), 0.4) / 0.4;

  return (
    <div className={`rounded-xl border p-5 ${colors.ring}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">{title}</p>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-500">Dein Wert</span>
        <span className="font-bold">{current}</span>
      </div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-500">Breakeven</span>
        <span className="font-semibold">{breakeven}</span>
      </div>
      <div className="flex justify-between text-sm mb-4">
        <span className="text-gray-500">Puffer</span>
        <span className={`font-bold ${colors.text}`}>{pufferLabel}</span>
      </div>
      {/* progress bar */}
      <div className="h-2 bg-white rounded-full border border-gray-200 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colors.bar}`} style={{ width: `${pct * 100}%` }} />
      </div>
      {warning && <p className="text-xs text-gray-400 mt-3">{warning}</p>}
    </div>
  );
}

function StressRow({ label, scenario, cfn, delta }) {
  const pos = cfn >= 0;
  return (
    <div className={`rounded-lg border px-4 py-3 ${pos ? "bg-green-50 border-green-200" : cfn >= -300 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{scenario}</p>
        </div>
        <div className="text-right ml-4 shrink-0">
          <p className={`text-lg font-bold tabular-nums ${pos ? "text-green-700" : "text-red-600"}`}>{fe(cfn)}/M</p>
          <p className={`text-xs font-semibold ${delta >= 0 ? "text-green-600" : "text-red-500"}`}>
            {delta >= 0 ? "+" : ""}{fe(delta)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Risiko({ result, inputs, beKm, beZ1, loading }) {
  if (loading && !result) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Wird berechnet…</div>
  );
  if (!result) return null;

  const { s } = result;
  const pufferKm = beKm != null && inputs.km > 0 ? (inputs.km - beKm) / inputs.km : 0;
  const pufferZ1 = beZ1 != null ? beZ1 - inputs.z1 : 0;

  const stressTests = [
    {
      label: "Basis (aktuell)",
      scenario: "Aktuelle Eingaben",
      cfn: s.cfn,
      delta: 0,
    },
    {
      label: "3 Monate Leerstand",
      scenario: "Kein Mieter für 3 Monate",
      cfn: s.cfn - inputs.km * 3 / 12,
      delta: -inputs.km * 3 / 12,
    },
    {
      label: "Zinsanstieg +2 %",
      scenario: `Anschluss bei ${fp(inputs.z1 + 0.02)} nach Zinsbindungsende`,
      cfn: s.cfn - (inputs.d1p * inputs.kp * 0.02) / 12,
      delta: -(inputs.d1p * inputs.kp * 0.02) / 12,
    },
    {
      label: "Miete −15 %",
      scenario: "Neuvermietung zu niedrigerer Marktmiete",
      cfn: s.cfn - inputs.km * 0.15 * (1 - s.gst),
      delta: -inputs.km * 0.15 * (1 - s.gst),
    },
    {
      label: "Ungeplante Sanierung",
      scenario: "Heizung/Dach: 20.000 € auf 5 Jahre verteilt",
      cfn: s.cfn - 20000 / 60,
      delta: -20000 / 60,
    },
    {
      label: "Worst Case",
      scenario: "Leerstand 2M + Zins +1 % + Miete −10 %",
      cfn: s.cfn - inputs.km * 2 / 12 - (inputs.d1p * inputs.kp * 0.01) / 12 - inputs.km * 0.1,
      delta: -(inputs.km * 2 / 12 + (inputs.d1p * inputs.kp * 0.01) / 12 + inputs.km * 0.1),
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      {/* Breakeven */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 mb-3">Wie viel Puffer hast du?</h2>
        <div className="grid grid-cols-2 gap-4">
          <BreakevenCard
            title="Breakeven Kaltmiete"
            current={`${fe(inputs.km)}/M`}
            breakeven={beKm != null ? `${fe(beKm)}/M` : "…"}
            puffer={pufferKm}
            pufferLabel={beKm != null ? `${fe(inputs.km - beKm)}/M (${fp(pufferKm)})` : "—"}
            warning="Fällt die Miete unter diesen Wert, kostet das Objekt monatlich Geld."
          />
          <BreakevenCard
            title="Breakeven Zinssatz"
            current={fp(inputs.z1)}
            breakeven={beZ1 != null ? fp(beZ1) : "…"}
            puffer={pufferZ1 * 5}
            pufferLabel={beZ1 != null ? `+${fp(pufferZ1)} Spielraum` : "—"}
            warning="Bis zu diesem Zinssatz bleibt der Cashflow positiv."
          />
        </div>
      </div>

      {/* Stress Tests */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 mb-3">Was passiert wenn…? — Stress-Szenarien</h2>
        <p className="text-xs text-gray-400 mb-3">Näherungswerte. Für exakte Berechnung: Eingaben anpassen.</p>
        <div className="flex flex-col gap-2">
          {stressTests.map((t, i) => <StressRow key={i} {...t} />)}
        </div>
      </div>

      {/* Risikoprofil */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Risikoprofil</h2>
        <div className="flex flex-col gap-4">
          {[
            { label: `Mietpuffer: ${fp(Math.max(pufferKm, 0))}`, pct: Math.min(Math.max(pufferKm, 0) / 0.4, 1), good: pufferKm > 0.15 },
            { label: `Zinspuffer: +${fp(Math.max(pufferZ1, 0))} pp`, pct: Math.min(Math.max(pufferZ1, 0) / 0.05, 1), good: pufferZ1 > 0.02 },
            { label: `Eigenkapitalquote: ${fp(1 - s.dg / inputs.kp)} (LTV ${fp(s.dg / inputs.kp)})`, pct: Math.min(Math.max(1 - s.dg / inputs.kp, 0), 1), good: s.dg / inputs.kp < 0.8 },
            { label: `IH-Rücklage: ${inputs.ihq} €/m²/J (Empfehlung: 8–12)`, pct: Math.min(inputs.ihq / 12, 1), good: inputs.ihq >= 8 },
          ].map(({ label, pct, good }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{label}</span>
                <span className={good ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>{good ? "✓ OK" : "⚠ Niedrig"}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${good ? "bg-green-400" : "bg-red-400"}`} style={{ width: `${pct * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

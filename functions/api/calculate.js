// Immobilien-Kalkulator — calculation engine
// Cloudflare Pages Function: POST /api/calculate

const GREST = {
  "Baden-Württemberg": 0.05, "Bayern": 0.035, "Berlin": 0.06,
  "Brandenburg": 0.065, "Bremen": 0.05, "Hamburg": 0.055,
  "Hessen": 0.06, "Mecklenburg-Vorpommern": 0.06, "Niedersachsen": 0.05,
  "Nordrhein-Westfalen": 0.065, "Rheinland-Pfalz": 0.05, "Saarland": 0.065,
  "Sachsen": 0.055, "Sachsen-Anhalt": 0.05, "Schleswig-Holstein": 0.065,
  "Thüringen": 0.065,
};

function est(z) {
  z = Math.max(0, Math.floor(z));
  if (z <= 11604) return 0;
  if (z <= 17005) { const y = (z - 11604) / 1e4; return (922.98 * y + 1400) * y; }
  if (z <= 66760) { const y = (z - 17005) / 1e4; return (181.19 * y + 2397) * y + 1025.38; }
  if (z <= 277825) return 0.42 * z - 10602.13;
  return 0.45 * z - 18936.88;
}

function marginalTaxRate(zve, gemeinsam = false, kirche = false) {
  const e0 = gemeinsam ? est(zve / 2) * 2 : est(zve);
  const e1 = gemeinsam ? est((zve + 1) / 2) * 2 : est(zve + 1);
  const r = (e1 - e0) * 1.055; // Solidaritätszuschlag
  return kirche ? r * 1.085 : r;
}

function calculate(p) {
  const {
    kp, km, z1, t1, d1p, d2s = 0, z2 = 0, t2 = 0,
    hg, gsm, ihq, wfl, ma, mst, wst, kst,
    bj, ga, inv = 0, zve, vl, ki, mk, no, gb, bl,
    zfest = 10,   // Zinsbindungsfrist Darlehen I (Jahre)
    zans,         // Anschlusszinssatz nach Ablauf (default = z1)
  } = p;

  const zans_ = (zans != null) ? zans : z1;

  const gr = GREST[bl] || 0.065;
  const nk = (gr + mk + no + gb) * kp;
  const gi = kp + nk + inv;
  const d1 = d1p * kp;
  const dg = d1 + d2s;
  const ek = gi - dg;

  // Year-1 annuities (for summary stats)
  const a1 = (z1 + t1) * d1;
  const a2 = (z2 + t2) * d2s;
  const rm = (a1 + a2) / 12;

  const ihm = wfl * ihq / 12;          // Instandhaltung €/Monat
  const um = gsm;                       // Grundsteuer + Nebenkosten
  const wm = km + um;                   // Warmmiete
  const mam = ma * wm;                  // Mietausfall €/Monat
  const bg = um + hg + ihm + mam;       // Bewirtschaftungskosten gesamt

  // AfA
  const afs = bj === "vor 1925" ? 0.025 : 0.02;
  const afb = ga * (kp + nk) + inv;     // AfA-Basis
  const afp = afs * afb;               // AfA €/Jahr
  const afm = afp / 12;
  const afx = Math.floor(1 / afs);     // AfA-Laufzeit (Jahre)

  const GST = marginalTaxRate(zve, vl === "Gemeinsam", ki);

  // Year-1 summary values (for KPIs)
  const zm = z1 * d1 / 12;
  const tm = t1 * d1 / 12;
  const cfop = wm - bg - rm;
  const scf = wm - (bg - ihm - mam) - zm - afm;
  const stm = GST * scf;
  const cfn = cfop - stm;
  const ws = kp + inv;

  // Nettomietrendite
  const nmr = gi > 0 ? (wm - bg) * 12 / gi : 0;
  // EK-Rendite (Jahr 1)
  const ekr = ek > 0 ? (12 * cfn + 12 * tm + ws * wst) / ek : 0;

  // ── 60-year projection ───────────────────────────────
  let r1 = d1, r2 = d2s, ka = 0;
  const rows = [];

  for (let i = 0; i < 60; i++) {
    // Switch interest rate after Zinsbindungsende
    const rate1 = i < zfest ? z1 : zans_;
    const a1_i = (rate1 + t1) * d1;   // annuity for this year

    const mi = km * Math.pow(1 + mst, i);
    const ui = um * Math.pow(1 + kst, i);
    const wi = mi + ui;
    const we = ws * Math.pow(1 + wst, i + 1);

    // AfA for this year
    let ai = i < afx ? Math.max(0, Math.min(afp, afb - ka)) : 0;
    ka += ai;

    // Darlehen I
    const zz1 = rate1 * r1;
    const tt1 = Math.min(r1, Math.max(a1_i - zz1, 0));
    r1 = Math.max(r1 - tt1, 0);

    // Darlehen II
    const zz2 = z2 * r2;
    const tt2 = d2s > 0 ? Math.min(r2, Math.max(a2 - zz2, 0)) : 0;
    r2 = Math.max(r2 - tt2, 0);

    const zi = zz1 + zz2;
    const ti = tt1 + tt2;
    const rsi = r1 + r2;

    const bi = ui + (hg + ihm) * Math.pow(1 + kst, i) + ma * wi;
    const coi = wi - bi - (zi + ti) / 12;

    // Steuerliche Berechnung
    const sci = wi - (ui + hg * Math.pow(1 + kst, i)) - zi / 12 - ai / 12;
    const sti = GST * sci;
    const cni = coi - sti;

    rows.push({
      jr: 2026 + i, j: i,
      mi, wi, bi,
      rm: (zi + ti) / 12,  // actual monthly rate (changes after zfest!)
      co: coi, st: sti, cn: cni, cj: cni * 12,
      zi, ti, rs: rsi, w: we, nv: we - rsi, af: ai,
      refi: i === zfest,  // mark refinancing year
    });
  }

  // Cumulative values
  let cumCf = 0, cumZ = 0;
  rows.forEach(r => {
    cumCf += r.cj; r.kcf = cumCf;
    cumZ += r.zi; r.kz = cumZ;
    r.tot = r.nv + cumCf;
  });

  const vt = rows.find(r => r.rs <= 0);
  const cfpy = rows.find(r => r.cn >= 0);

  const s = {
    cfn, ek, gi, nk, rm, br: kp ? km * 12 / kp : 0,
    nmr,  // Nettomietrendite
    stm, zm, tm, afm, gst: GST, bg, wm, cfop,
    vtj: vt ? vt.jr : null,
    cfpy: cfpy ? cfpy.jr : null,
    ws, ekr,
    d1, dg, afp, afb, afs, ihm, mam, gr,
  };

  return { df: rows, s };
}

function findBreakeven(key, lo, hi, step, params) {
  for (let v = Math.floor(lo * step); v <= Math.floor(hi * step); v++) {
    const vv = v / step;
    const { s } = calculate({ ...params, [key]: vv });
    if (key === "km" && s.cfn >= 0) return vv;
    if (key === "z1" && s.cfn < 0) return Math.max(0, (v - 1) / step);
  }
  return null;
}

function sensitivity2D(params) {
  const { km, z1 } = params;
  // 9 z1 values: current ± 2% in 0.5% steps
  const z1Steps = Array.from({ length: 9 }, (_, i) => Math.max(0.005, z1 + (i - 4) * 0.005));
  // 9 km values: current ± 200€ in 50€ steps
  const kmSteps = Array.from({ length: 9 }, (_, i) => Math.max(0, km + (i - 4) * 50));

  const cfMatrix = z1Steps.map(zv =>
    kmSteps.map(kv => {
      try { return calculate({ ...params, z1: zv, km: kv }).s.cfn; }
      catch { return null; }
    })
  );
  const ekMatrix = z1Steps.map(zv =>
    kmSteps.map(kv => {
      try { return calculate({ ...params, z1: zv, km: kv }).s.ekr; }
      catch { return null; }
    })
  );

  return { z1Steps, kmSteps, cfMatrix, ekMatrix, currentZ1: z1, currentKm: km };
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { action = "calculate", params } = body;

    let result;
    if (action === "calculate") {
      result = calculate(params);
    } else if (action === "breakeven_km") {
      result = { value: findBreakeven("km", 0, params.kp / 5, 1, params) };
    } else if (action === "breakeven_z1") {
      result = { value: findBreakeven("z1", 0, 0.15, 10000, params) };
    } else if (action === "sensitivity_2d") {
      result = sensitivity2D(params);
    } else if (action === "tornado") {
      const base = calculate(params).s.cfn;
      const { km, z1, kp, wst, t1 } = params;
      const tests = [
        ["Miete +100 €", "km", km + 100],
        ["Miete -100 €", "km", km - 100],
        ["Zins +1 %", "z1", z1 + 0.01],
        ["Zins -1 %", "z1", Math.max(0, z1 - 0.01)],
        ["KP +50k €", "kp", kp + 50000],
        ["KP -50k €", "kp", kp - 50000],
        ["Wertstg. 3%", "wst", 0.03],
        ["Tilgung 2%", "t1", 0.02],
        ["Mietstg. +2%", "mst", 0.02],
      ];
      result = {
        items: tests
          .map(([label, key, val]) => {
            try { return [label, calculate({ ...params, [key]: val }).s.cfn - base]; }
            catch { return null; }
          })
          .filter(Boolean)
          .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      };
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400 });
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

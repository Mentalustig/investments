// Immobilien-Kalkulator — calculation engine v2
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
  const r = (e1 - e0) * 1.055;
  return kirche ? r * 1.085 : r;
}

// IRR via Newton-Raphson — finds r such that NPV(cashflows) = 0
// cashflows[0] = initial investment (negative), cashflows[1..n] = annual net cashflows
function calcIRR(cashflows) {
  if (cashflows.length < 2) return null;
  let r = 0.08; // initial guess 8%
  for (let iter = 0; iter < 200; iter++) {
    let npv = 0, dnpv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const d = Math.pow(1 + r, t);
      npv += cashflows[t] / d;
      dnpv -= t * cashflows[t] / (d * (1 + r));
    }
    if (Math.abs(dnpv) < 1e-12) break;
    const rNew = r - npv / dnpv;
    if (Math.abs(rNew - r) < 1e-9) { r = rNew; break; }
    r = rNew;
  }
  return (r > -0.99 && r < 10) ? r : null;
}

function calculate(p) {
  const {
    kp, km, z1, t1, d1p, d2s = 0, z2 = 0, t2 = 0,
    hg = 0, gsm = 0, ihq = 10, wfl = 60, ma = 0,
    mst = 0, wst = 0.02, kst = 0.02,
    bj = "1951-1960", ga = 0.8, inv = 0,
    zve = 60000, vl = "Einzeln", ki = false,
    mk = 0, no = 0.015, gb = 0.005, bl = "Nordrhein-Westfalen",
    zfest = 10, zans,
  } = p;

  const zans_ = zans != null ? zans : z1;
  const gr = GREST[bl] || 0.065;
  const nk = (gr + mk + no + gb) * kp;
  const gi = kp + nk + inv;             // Gesamtinvestition
  const d1 = d1p * kp;
  const dg = d1 + d2s;
  const ek = gi - dg;                   // Eigenkapital (tatsächlich eingesetzt)

  const a1 = (z1 + t1) * d1;
  const a2 = (z2 + t2) * d2s;
  const rm = (a1 + a2) / 12;           // monatliche Rate Jahr 1

  const ihm = wfl * ihq / 12;           // Instandhaltungsrücklage €/M
  const um = gsm;                        // Grundsteuer/NK (umlagefähig)
  const wm = km + um;                    // Warmmiete
  const mam = ma * km;                   // Mietausfall auf Kaltmiete
  const bg = hg + ihm + mam;            // nicht-umlagefähige Bewirtschaftungskosten

  const afs = bj === "vor 1925" ? 0.025 : 0.02;
  const afb = ga * (kp + nk) + inv;
  const afp = afs * afb;
  const afm = afp / 12;
  const afx = Math.floor(1 / afs);

  const GST = marginalTaxRate(zve, vl === "Gemeinsam", ki);

  // Jahr-1 Kennzahlen
  const zm = z1 * d1 / 12;
  const tm = t1 * d1 / 12;
  const cfop = km - bg - rm;            // CF operativ (Kaltmiete - Kosten - Rate)
  const scf = km - bg - zm - afm;       // steuerliche Bemessungsgrundlage
  const stm = GST * Math.max(scf, 0);  // Steuer nur bei positivem steuerpflichtigen Ergebnis
  const cfn = cfop - stm;              // CF netto

  // Kennzahlen
  const br = kp > 0 ? km * 12 / kp : 0;                          // Bruttomietrendite
  const nmr = gi > 0 ? (km - hg - ihm - mam) * 12 / gi : 0;     // Nettomietrendite
  const verv = km > 0 ? kp / (km * 12) : 0;                      // Vervielfältiger (KP/Jahresmiete)

  // 60-Jahres-Projektion
  let r1 = d1, r2 = d2s, ka = 0;
  const rows = [];

  for (let i = 0; i < 60; i++) {
    const rate1 = i < zfest ? z1 : zans_;
    const a1_i = (rate1 + t1) * d1;

    const mi = km * Math.pow(1 + mst, i);
    const ui = um * Math.pow(1 + kst, i);
    const wi = mi + ui;
    const we = (kp + inv) * Math.pow(1 + wst, i + 1);

    let ai = i < afx ? Math.max(0, Math.min(afp, afb - ka)) : 0;
    ka += ai;

    const zz1 = rate1 * r1;
    const tt1 = Math.min(r1, Math.max(a1_i - zz1, 0));
    r1 = Math.max(r1 - tt1, 0);

    const zz2 = z2 * r2;
    const tt2 = d2s > 0 ? Math.min(r2, Math.max(a2 - zz2, 0)) : 0;
    r2 = Math.max(r2 - tt2, 0);

    const zi = zz1 + zz2;
    const ti = tt1 + tt2;
    const rsi = r1 + r2;

    const bi = (hg + ihm) * Math.pow(1 + kst, i) + ma * mi;
    const coi = mi - bi - (zi + ti) / 12;
    const sci = mi - bi - zi / 12 - ai / 12;
    const sti = GST * Math.max(sci, 0);
    const cni = coi - sti;

    rows.push({
      jr: 2026 + i, j: i,
      mi, wi, bi,
      rm: (zi + ti) / 12,
      co: coi, st: sti, cn: cni, cj: cni * 12,
      zi, ti, rs: rsi, w: we, nv: we - rsi, af: ai,
      refi: i === zfest,
    });
  }

  let cumCf = 0, cumZ = 0;
  rows.forEach(r => {
    cumCf += r.cj; r.kcf = cumCf;
    cumZ += r.zi; r.kz = cumZ;
    r.tot = r.nv + cumCf;  // Nettovermögen + kumulierter CF
  });

  // IRR für verschiedene Zeithorizonte
  // Cashflows: Jahr 0 = -EK (Eigenkapitaleinsatz)
  // Jedes Jahr: CF netto
  // Im letzten Jahr: + Verkaufserlös (Marktwert - Restschuld)
  const IRR_YEARS = [3, 5, 10, 15, 20, 30, 50];
  const irr = {};
  for (const yr of IRR_YEARS) {
    const idx = yr - 1;
    if (idx >= rows.length) { irr[yr] = null; continue; }
    const cfs = [-ek];
    for (let i = 0; i <= idx; i++) {
      const cf = rows[i].cj;
      const exitValue = i === idx ? (rows[i].w - rows[i].rs) : 0;
      cfs.push(cf + exitValue);
    }
    irr[yr] = calcIRR(cfs);
  }

  // Kumulierte Einzahlungen vs. Rückflüsse für Rendite-Tab
  const cumInvested = rows.map((r, i) => ({
    year: r.jr,
    eingezahlt: ek + Math.max(0, -rows.slice(0, i + 1).reduce((s, x) => s + x.cj, 0)),
    rueckfluss: Math.max(0, rows.slice(0, i + 1).reduce((s, x) => s + x.cj, 0)),
    vermoegen: r.tot,
    etf7: ek * Math.pow(1.07, i + 1),
    etf5: ek * Math.pow(1.05, i + 1),
  }));

  const vt = rows.find(r => r.rs <= 0);
  const cfPositive = rows.find(r => r.cn >= 0);

  const s = {
    cfn, cfop, stm, zm, tm, rm, afm, afp, afb, afs,
    gst: GST, bg, wm, km,
    br, nmr, verv,
    ek, gi, dg, d1, nk,
    ekr: ek > 0 ? (12 * cfn + 12 * tm + kp * wst) / ek : 0,
    irr,
    gr,
    vtj: vt ? vt.jr : null,
    cfPositiveYear: cfPositive ? cfPositive.jr : null,
    ihm, mam, hg,
  };

  return { df: rows, s, cumInvested };
}

function findBreakeven(key, lo, hi, step, params) {
  for (let v = Math.floor(lo * step); v <= Math.floor(hi * step); v++) {
    const vv = v / step;
    try {
      const { s } = calculate({ ...params, [key]: vv });
      if (key === "km" && s.cfn >= 0) return vv;
      if (key === "z1" && s.cfn < 0) return Math.max(0, (v - 1) / step);
    } catch { /* skip */ }
  }
  return null;
}

function sensitivity2D(params) {
  const { km, z1 } = params;
  const z1Steps = Array.from({ length: 9 }, (_, i) => Math.max(0.005, z1 + (i - 4) * 0.005));
  const kmSteps = Array.from({ length: 9 }, (_, i) => Math.max(0, km + (i - 4) * 50));
  const cfMatrix = z1Steps.map(zv =>
    kmSteps.map(kv => { try { return calculate({ ...params, z1: zv, km: kv }).s.cfn; } catch { return null; } })
  );
  const ekMatrix = z1Steps.map(zv =>
    kmSteps.map(kv => { try { return calculate({ ...params, z1: zv, km: kv }).s.nmr; } catch { return null; } })
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

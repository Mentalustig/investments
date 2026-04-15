"""
Immobilien-Kalkulator — pure calculation logic, no Streamlit dependencies.
"""
import math
import pandas as pd

GREST = {
    "Baden-Württemberg": 0.05, "Bayern": 0.035, "Berlin": 0.06,
    "Brandenburg": 0.065, "Bremen": 0.05, "Hamburg": 0.055,
    "Hessen": 0.06, "Mecklenburg-Vorpommern": 0.06, "Niedersachsen": 0.05,
    "Nordrhein-Westfalen": 0.065, "Rheinland-Pfalz": 0.05, "Saarland": 0.065,
    "Sachsen": 0.055, "Sachsen-Anhalt": 0.05, "Schleswig-Holstein": 0.065,
    "Thüringen": 0.065,
}


def fe(v: float) -> str:
    s = f"{abs(v):,.0f}".replace(",", ".")
    return f"-{s} €" if v < 0 else f"{s} €"


def fp(v: float) -> str:
    return f"{v * 100:.1f}%"


def _est(z: float) -> float:
    z = max(0, math.floor(z))
    if z <= 11604:
        return 0
    if z <= 17005:
        y = (z - 11604) / 1e4
        return (922.98 * y + 1400) * y
    if z <= 66760:
        y = (z - 17005) / 1e4
        return (181.19 * y + 2397) * y + 1025.38
    if z <= 277825:
        return 0.42 * z - 10602.13
    return 0.45 * z - 18936.88


def _gst(z: float, gemeinsam: bool = False, kirche: bool = False) -> float:
    if gemeinsam:
        e0 = _est(z / 2) * 2
        e1 = _est((z + 1) / 2) * 2
    else:
        e0 = _est(z)
        e1 = _est(z + 1)
    r = (e1 - e0) * 1.055
    return r * 1.085 if kirche else r


def _ke(kirche: bool = False) -> float:
    s = 0.25 * 1.055
    return s * 1.085 if kirche else s


def run(kp, km, z1, t1, d1p, d2s, z2, t2, hg, gsm, ihq, wfl, ma,
        mst, wst, kst, bj, ga, inv, zve, vl, ki, mk, no, gb, bl):
    """
    Main calculation engine. Returns (df: DataFrame[60 years], s: dict[scalars]).
    All monetary values in EUR, rates as decimals (e.g. 0.0377 for 3.77%).
    """
    gr = GREST[bl]
    nk = (gr + mk + no + gb) * kp
    gi = kp + nk + inv
    d1 = d1p * kp
    dg = d1 + d2s
    ek = gi - dg
    a1 = (z1 + t1) * d1
    a2 = (z2 + t2) * d2s
    rm = (a1 + a2) / 12
    ihm = wfl * ihq / 12
    um = gsm
    wm = km + um
    mam = ma * wm
    bnu = hg + ihm + mam
    bg = um + bnu
    afs = 0.025 if bj == "vor 1925" else 0.02
    afb = ga * (kp + nk) + inv
    afp = afs * afb
    afm = afp / 12
    afx = int(1 / afs)
    gst = _gst(zve, vl == "Gemeinsam", ki)
    zg = (z1 * d1 + z2 * d2s) / dg if dg else 0
    tgv = (t1 * d1 + t2 * d2s) / dg if dg else 0
    zm = zg * dg / 12
    tm = tgv * dg / 12
    cfop = wm - bg - rm
    scf = wm - (bg - ihm - mam) - zm - afm
    stm = gst * scf
    cfn = cfop - stm
    ws = kp + inv
    r1, r2 = d1, d2s
    ka = 0
    P = []
    for i in range(60):
        mi = km * (1 + mst) ** i
        ui = um * (1 + kst) ** i
        wi = mi + ui
        we = ws * (1 + wst) ** (i + 1)
        ai = min(afp, afb - ka) if i < afx else 0
        ai = max(ai, 0)
        ka += ai
        zz1 = z1 * r1
        tt1 = min(r1, max(a1 - zz1, 0))
        r1 = max(r1 - tt1, 0)
        zz2 = z2 * r2
        tt2 = min(r2, max(a2 - zz2, 0)) if d2s > 0 else 0
        r2 = max(r2 - tt2, 0)
        zi = zz1 + zz2
        ti = tt1 + tt2
        rsi = r1 + r2
        bi = ui + (hg + ihm) * (1 + kst) ** i + ma * wi
        coi = wi - bi - (zi + ti) / 12
        sci = wi - (ui + hg * (1 + kst) ** i) - zi / 12 - ai / 12
        sti = gst * sci
        cni = coi - sti
        P.append({
            "jr": 2026 + i, "j": i,
            "mi": mi, "wi": wi, "bi": bi,
            "rm": (zi + ti) / 12,
            "co": coi, "st": sti, "cn": cni, "cj": cni * 12,
            "zi": zi, "ti": ti, "rs": rsi,
            "w": we, "nv": we - rsi, "af": ai,
        })
    df = pd.DataFrame(P)
    df["kcf"] = df["cj"].cumsum()
    df["tot"] = df["nv"] + df["kcf"]
    df["kz"] = df["zi"].cumsum()

    vt = df[df["rs"] <= 0]
    vtj = int(vt.iloc[0]["jr"]) if len(vt) > 0 else None
    cfpy = None
    for _, row in df.iterrows():
        if row["cn"] >= 0:
            cfpy = int(row["jr"])
            break

    return df, {
        "cfn": cfn, "ek": ek, "gi": gi, "nk": nk, "rm": rm,
        "br": km * 12 / kp if kp else 0,
        "stm": stm, "zm": zm, "tm": tm, "afm": afm,
        "gst": gst, "bg": bg, "wm": wm, "cfop": cfop,
        "vtj": vtj, "cfpy": cfpy, "ws": ws,
        "ekr": (12 * cfn + 12 * tm + ws * wst) / ek if ek > 0 else 0,
        "d1": d1, "dg": dg, "afp": afp, "afb": afb, "afs": afs,
        "ihm": ihm, "mam": mam, "bnu": bnu, "gr": gr,
    }


def sim(r, styp, tfrei, ek, df, spb, ki):
    """Simulate alternative investment (Festgeld, ETF, REIT)."""
    ker = _ke(ki)
    p = ek
    ein = ek
    H = []
    for i in range(60):
        cf_i = df.iloc[i]["cn"] if i < len(df) else 0
        spar = -cf_i * 12 if cf_i < 0 else 0
        p += spar
        ein += spar
        ert = p * r
        if styp == "j":
            st_ = max(0, ert - spb) * ker
            p += ert - st_
        elif styp == "t":
            vp = max(0, min(0.016, r)) * p
            st_ = max(0, vp * (1 - tfrei) - spb) * ker
            p += ert - st_
        else:
            p += ert
        gew = p - ein
        vs = max(0, gew * (1 - tfrei)) * ker if styp != "n" else 0
        H.append({"jahr": 2026 + i, "netto": p - vs, "ein": ein})
    return pd.DataFrame(H)


def find_be(key, lo, hi, step, A):
    """Find breakeven value for a given input key."""
    for v in range(int(lo * step), int(hi * step) + 1):
        vv = v / step
        _, ts = run(**{**A, key: vv})
        if key == "km" and ts["cfn"] >= 0:
            return vv
        if key == "z1" and ts["cfn"] < 0:
            return max(0, (v - 1) / step)
    return None


def tornado_analysis(A):
    """Sensitivity analysis — returns list of (label, delta_cfn) sorted by |delta|."""
    km, z1, kp = A["km"], A["z1"], A["kp"]
    wst, t1, mst, ga = A["wst"], A["t1"], A["mst"], A["ga"]
    base = run(**A)[1]["cfn"]
    tests = [
        ("Miete +100 €", "km", km + 100),
        ("Miete -100 €", "km", km - 100),
        ("Zins +1 %", "z1", z1 + 0.01),
        ("Zins -1 %", "z1", max(0, z1 - 0.01)),
        ("KP +50k €", "kp", kp + 50000),
        ("KP -50k €", "kp", kp - 50000),
        ("Wertstg. 0 %", "wst", 0),
        ("Wertstg. 3 %", "wst", 0.03),
        ("Tilgung 2 %", "t1", 0.02),
        ("Tilgung 0.5 %", "t1", 0.005),
        ("Mietstg. +2 %", "mst", 0.02),
        ("Gebäude 90 %", "ga", 0.9),
    ]
    items = []
    for n, k, v in tests:
        try:
            _, ts = run(**{**A, k: v})
            items.append((n, ts["cfn"] - base))
        except Exception:
            pass
    return sorted(items, key=lambda x: abs(x[1]), reverse=True)

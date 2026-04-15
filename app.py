"""
Immobilien-Kalkulator
=====================
streamlit run app.py
"""
import streamlit as st
from calculator import run, fe, fp, GREST
from tabs import cockpit, diagramme, vergleich, szenarien, details

st.set_page_config(
    page_title="Immobilien-Kalkulator",
    layout="wide",
    page_icon="🏠",
    initial_sidebar_state="expanded",
)

# ── Minimal branding CSS ──────────────────────────────────────────────────────
st.markdown("""
<style>
[data-testid="stSidebar"] > div:first-child { padding-top: 1rem; }
[data-testid="stSidebar"] h3 {
    color: #1e293b;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 1.2rem 0 0.3rem;
    font-weight: 700;
}
.stTabs [data-baseweb="tab-list"] { gap: 4px; }
.stTabs [data-baseweb="tab"] {
    font-weight: 600;
    font-size: 0.9rem;
    padding: 0.5rem 1.2rem;
    border-radius: 6px 6px 0 0;
}
div[data-testid="metric-container"] {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
}
</style>
""", unsafe_allow_html=True)


# ── Sidebar ───────────────────────────────────────────────────────────────────
def render_sidebar():
    with st.sidebar:
        st.image("https://img.icons8.com/fluency/48/home.png", width=36)
        st.markdown("## Immobilien-Kalkulator")

        # Presets
        preset = st.selectbox("Schnellstart", [
            "Eigene Eingaben",
            "Basis (300k, 100% Bank)",
            "Optimiert (100k Bank + Bauspar)",
            "Cashflow-Max (viel EK)",
        ])
        presets = {
            "Basis (300k, 100% Bank)":
                dict(d1p_v=100, z1_v=3.77, t1_v=1.0, d2s_v=0, z2_v=0.0, t2_v=0.0, km_v=700, ga_v=80),
            "Optimiert (100k Bank + Bauspar)":
                dict(d1p_v=33, z1_v=3.40, t1_v=1.0, d2s_v=47000, z2_v=1.5, t2_v=6.5, km_v=750, ga_v=90),
            "Cashflow-Max (viel EK)":
                dict(d1p_v=17, z1_v=3.20, t1_v=1.0, d2s_v=47000, z2_v=1.5, t2_v=6.5, km_v=800, ga_v=90),
        }
        pr = presets.get(preset, {})

        # ── Objekt ────────────────────────────────────────────────────────────
        st.markdown("### Objekt")
        adr = st.text_input("Adresse", "Düsseldorf")
        c1, c2 = st.columns(2)
        wfl = c1.number_input("Wohnfläche m²", 10, 1000, 60, 5)
        kp = c2.number_input("Kaufpreis €", 10_000, 5_000_000, 300_000, 10_000)
        km = st.number_input("Kaltmiete €/M", 0, 10_000, pr.get("km_v", 700), 50)
        bl = st.selectbox("Bundesland", list(GREST.keys()), index=9)

        # ── Kaufnebenkosten ───────────────────────────────────────────────────
        st.markdown("### Kaufnebenkosten")
        gr_display = GREST[bl]
        st.caption(f"Grunderwerbsteuer {bl}: {gr_display*100:.1f}%")
        c1, c2, c3 = st.columns(3)
        mk = c1.number_input("Makler %", 0.0, 10.0, 0.0, 0.5) / 100
        no = c2.number_input("Notar %", 0.0, 5.0, 1.5, 0.1) / 100
        gb = c3.number_input("Grundbuch %", 0.0, 2.0, 0.5, 0.1) / 100
        inv = st.number_input("Anfangsinvest. €", 0, 500_000, 0, 1_000)

        # ── Finanzierung ──────────────────────────────────────────────────────
        st.markdown("### Finanzierung")
        d1p = st.slider("Darlehen I (% vom KP)", 0, 110, pr.get("d1p_v", 100), 5) / 100
        c1, c2 = st.columns(2)
        z1 = c1.number_input("Zins I %", 0.0, 15.0, pr.get("z1_v", 3.77), 0.01) / 100
        t1 = c2.number_input("Tilgung I %", 0.0, 15.0, pr.get("t1_v", 1.0), 0.1) / 100
        zfest = st.number_input("Zinsbindung Jahre", 1, 30, 10, 1)

        with st.expander("Darlehen II (Bauspar)"):
            d2s = st.number_input("Summe II €", 0, 2_000_000, pr.get("d2s_v", 0), 1_000)
            z2 = t2 = 0.0
            if d2s > 0:
                c1, c2 = st.columns(2)
                z2 = c1.number_input("Zins II %", 0.0, 15.0, pr.get("z2_v", 1.5), 0.01) / 100
                t2 = c2.number_input("Tilgung II %", 0.0, 15.0, pr.get("t2_v", 6.5), 0.1) / 100

        # ── Bewirtschaftung ───────────────────────────────────────────────────
        st.markdown("### Bewirtschaftung")
        c1, c2 = st.columns(2)
        hg = c1.number_input("Hausgeld n.u. €/M", 0, 5_000, 0, 10)
        gsm = c2.number_input("Grundsteuer €/M", 0, 1_000, 120, 10)
        c1, c2 = st.columns(2)
        ihq = c1.number_input("IH-Rücklage €/m²/J", 0.0, 50.0, 10.0, 1.0)
        ma = c2.number_input("Mietausfall %", 0.0, 30.0, 0.0, 1.0) / 100

        # ── Prognose & Steuer ─────────────────────────────────────────────────
        st.markdown("### Prognose & Steuer")
        c1, c2, c3 = st.columns(3)
        mst = c1.number_input("Mietstg. %/J", 0.0, 10.0, 0.0, 0.5) / 100
        kst = c2.number_input("Kostenst. %/J", 0.0, 10.0, 2.0, 0.5) / 100

        wm_sel = st.selectbox("Wertsteigerung", ["Konservativ 1%", "Mittel 2%", "Optimistisch 3%", "Eigener Wert"])
        wst = {"Konservativ 1%": 0.01, "Mittel 2%": 0.02, "Optimistisch 3%": 0.03}.get(wm_sel)
        if wst is None:
            wst = st.number_input("Wertst. %/J", -5.0, 15.0, 2.0, 0.5) / 100

        bj = st.selectbox("Baujahr", [
            "vor 1925", "1925-1950", "1951-1960", "1961-1970",
            "1971-1980", "1981-1990", "1991-2000", "2001-2010", "ab 2010",
        ], index=2)
        ga = st.slider("Gebäudeanteil %", 0, 100, pr.get("ga_v", 80), 5) / 100

        c1, c2 = st.columns(2)
        vl = c1.selectbox("Veranlagung", ["Einzeln", "Gemeinsam"])
        zve = c2.number_input("zvE €/J", 0, 1_000_000, 200_000, 5_000)
        c1, c2 = st.columns(2)
        ki = c1.checkbox("Kirchensteuer", False)
        spb = c2.number_input("Sparerpauschb. €", 0, 4_000, 1_000, 100)

    return dict(
        kp=kp, km=km, z1=z1, t1=t1, d1p=d1p, d2s=d2s, z2=z2, t2=t2,
        hg=hg, gsm=gsm, ihq=ihq, wfl=wfl, ma=ma, mst=mst, wst=wst,
        kst=kst, bj=bj, ga=ga, inv=inv, zve=zve, vl=vl, ki=ki,
        mk=mk, no=no, gb=gb, bl=bl,
        # UI-only
        adr=adr, spb=spb, zfest=zfest,
    )


# ── Run keys (passed to calculator.run) ──────────────────────────────────────
RUN_KEYS = [
    "kp", "km", "z1", "t1", "d1p", "d2s", "z2", "t2",
    "hg", "gsm", "ihq", "wfl", "ma", "mst", "wst", "kst",
    "bj", "ga", "inv", "zve", "vl", "ki", "mk", "no", "gb", "bl",
]


@st.cache_data(show_spinner=False)
def calculate(**kwargs):
    return run(**kwargs)


# ── Main ──────────────────────────────────────────────────────────────────────
inputs = render_sidebar()
A = {k: inputs[k] for k in RUN_KEYS}

try:
    df, s = calculate(**A)
except Exception as e:
    st.error(f"Berechnungsfehler: {e}")
    st.stop()

# Store kp/gsm for chart helpers
s["kp"] = inputs["kp"]
s["gsm_approx"] = inputs["gsm"]

# ── Page header ───────────────────────────────────────────────────────────────
col_h1, col_h2 = st.columns([4, 1])
col_h1.title(f"🏠 {inputs['adr']}")
col_h2.caption(
    f"{inputs['wfl']} m² · {fe(inputs['kp'])} · "
    f"Wertst. {inputs['wst']*100:.1f}%/J · "
    f"zvE {fe(inputs['zve'])}"
)

# Zinsfestschreibungswarnung
zfest = inputs["zfest"]
if zfest < len(df) and df.iloc[zfest - 1]["rs"] > 0:
    rs_zf = df.iloc[zfest - 1]["rs"]
    stress_rate = (0.05 + inputs["t1"]) * rs_zf / 12
    st.warning(
        f"Nach {zfest}J Zinsbindung: Restschuld **{fe(rs_zf)}** · "
        f"Bei 5% Anschluss: **{fe(stress_rate)}/M** Rate"
    )

# ── Tabs ──────────────────────────────────────────────────────────────────────
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "📊 Cockpit",
    "📈 Diagramme",
    "⚖️ Vergleich",
    "🎲 Szenarien",
    "📋 Details",
])

with tab1:
    cockpit.render(df, s, inputs)

with tab2:
    diagramme.render(df, s, inputs)

with tab3:
    vergleich.render(df, s, inputs)

with tab4:
    szenarien.render(df, s, inputs, A)

with tab5:
    details.render(df, s, inputs)

import streamlit as st
from calculator import fe, fp
from components.charts import fig_cashflow_waterfall, fig_invest_pie, fig_financing_pie


def render(df, s, inputs):
    kp = inputs["kp"]
    nk = s["nk"]
    inv = inputs["inv"]
    d1 = s["d1"]
    d2s = inputs["d2s"]
    ek = s["ek"]

    # ── KPI Row ──────────────────────────────────────────────────────────────
    c1, c2, c3, c4, c5, c6 = st.columns(6)
    cfn_color = "normal" if s["cfn"] >= 0 else "inverse"
    c1.metric("CF netto / Monat", fe(s["cfn"]),
              delta="positiv" if s["cfn"] >= 0 else "negativ",
              delta_color=cfn_color)
    c2.metric("Eigenkapital", fe(ek))
    c3.metric("Brutto-Rendite", fp(s["br"]),
              delta="≥4% Ziel" if s["br"] >= 0.04 else "<4%",
              delta_color="normal" if s["br"] >= 0.04 else "inverse")
    c4.metric("EK-Rendite p.a.", fp(s["ekr"]),
              delta_color="normal" if s["ekr"] > 0 else "inverse")
    c5.metric("CF+ ab Jahr", str(s["cfpy"]) if s["cfpy"] else "nie")
    c6.metric("Schuldenfrei", str(s["vtj"]) if s["vtj"] else ">60J")

    st.divider()

    # ── Three mini charts ─────────────────────────────────────────────────────
    col1, col2, col3 = st.columns(3)
    with col1:
        st.plotly_chart(fig_invest_pie(s, kp, nk, inv), use_container_width=True)
    with col2:
        st.plotly_chart(fig_financing_pie(s, d1, d2s, ek), use_container_width=True)
    with col3:
        st.plotly_chart(fig_cashflow_waterfall(s), use_container_width=True)

    st.divider()

    # ── Kennzahlen heute ─────────────────────────────────────────────────────
    left, right = st.columns(2)

    with left:
        st.subheader("Investition & Finanzierung")
        data = {
            "Kaufpreis": fe(kp),
            "Nebenkosten": f"{fe(nk)} ({fp(nk/kp)})" if kp else fe(nk),
            "Gesamtinvestition": fe(s["gi"]),
            "Eigenkapital": fe(ek),
            "Darlehen gesamt": fe(s["dg"]),
            "Rate / Monat": fe(s["rm"]),
        }
        for k, v in data.items():
            cols = st.columns([3, 2])
            cols[0].write(k)
            cols[1].write(f"**{v}**")

    with right:
        st.subheader("Monatlicher Cashflow")
        data = {
            "Warmmiete": fe(s["wm"]),
            "Bewirtschaftungskosten": f"-{fe(s['bg'])}",
            "davon Zinsen": f"-{fe(s['zm'])}",
            "davon Tilgung": f"-{fe(s['tm'])}",
            "CF operativ": fe(s["cfop"]),
            "Steuern": fe(-s["stm"]),
            "CF nach Steuern": fe(s["cfn"]),
        }
        for k, v in data.items():
            cols = st.columns([3, 2])
            cols[0].write(k)
            bold = k in ("CF operativ", "CF nach Steuern")
            cols[1].write(f"**{v}**" if bold else v)

    st.divider()

    # ── Kennzahlen in der Zukunft ─────────────────────────────────────────────
    st.subheader("Kennzahlen in der Zukunft")
    years = [1, 5, 10, 15, 20, 30]
    cols = st.columns(len(years) + 1)
    cols[0].write("")  # label column
    labels = ["CF netto/M", "Netto-Vermögen", "Immobilienwert", "Restschuld"]

    rows = {lbl: [] for lbl in labels}
    for y in years:
        if y <= len(df):
            row = df.iloc[y - 1]
            rows["CF netto/M"].append(fe(row["cn"]))
            rows["Netto-Vermögen"].append(fe(row["nv"]))
            rows["Immobilienwert"].append(fe(row["w"]))
            rows["Restschuld"].append(fe(row["rs"]))
        else:
            for lbl in labels:
                rows[lbl].append("—")

    header_cols = st.columns([2] + [1] * len(years))
    header_cols[0].write("**Kennzahl**")
    for i, y in enumerate(years):
        header_cols[i + 1].write(f"**{y}J**")

    for lbl in labels:
        row_cols = st.columns([2] + [1] * len(years))
        row_cols[0].write(lbl)
        for i, val in enumerate(rows[lbl]):
            row_cols[i + 1].write(val)

    # ── AfA-Hinweis ──────────────────────────────────────────────────────────
    st.divider()
    afa_sav = s["gst"] * s["afm"]
    st.info(
        f"**AfA-Steuerersparnis:** {fe(afa_sav)}/M ({fe(afa_sav * 12)}/J) · "
        f"Grenzsteuersatz: {fp(s['gst'])} · "
        f"AfA-Basis: {fe(s['afb'])} @ {fp(s['afs'])}"
    )

import streamlit as st
from calculator import fe, fp, _ke, sim
from components.charts import fig_opportunity


def render(df, s, inputs):
    ki = inputs["ki"]
    spb = inputs["spb"]
    ek = s["ek"]
    ker = _ke(ki)

    # ── Alternative investment config ────────────────────────────────────────
    st.subheader("Vergleichs-Investments")
    col1, col2, col3 = st.columns(3)
    with col1:
        fg_on = st.checkbox("🏦 Festgeld", value=True)
        fg_r = st.number_input("Festgeld-Rendite %", 0.0, 10.0, 2.5, 0.1,
                               key="fg_r") / 100 if fg_on else 0
    with col2:
        etf_on = st.checkbox("📈 Aktien-ETF", value=True)
        etf_r = st.number_input("ETF-Rendite %", 0.0, 20.0, 7.0, 0.5,
                                key="etf_r") / 100 if etf_on else 0
    with col3:
        reit_on = st.checkbox("🏠 REIT", value=False)
        reit_r = st.number_input("REIT-Rendite %", 0.0, 20.0, 5.0, 0.5,
                                 key="reit_r") / 100 if reit_on else 0

    opp = []
    if fg_on:
        opp.append(("🏦 Festgeld", sim(fg_r, "j", 0, ek, df, spb, ki), "#94a3b8"))
    if etf_on:
        opp.append(("📈 Aktien-ETF", sim(etf_r, "t", 0.30, ek, df, spb, ki), "#eab308"))
    if reit_on:
        opp.append(("🏠 REIT", sim(reit_r, "t", 0.60, ek, df, spb, ki), "#8b5cf6"))

    if s["cfn"] < 0:
        st.info(
            f"Du zahlst **{fe(abs(s['cfn']))}/M** drauf → wird beim alternativen "
            f"Investment als monatliche Sparrate angelegt."
        )

    st.divider()

    # ── Comparison table at 10/20/30 years ───────────────────────────────────
    if opp:
        header = st.columns([2] + [2] * len(opp) + [2])
        header[0].write("**Zeitraum**")
        header[1].write("**🏠 Immobilie**")
        for i, (nm, _, _) in enumerate(opp):
            header[i + 2].write(f"**{nm}**")

        for y in [10, 20, 30]:
            if y > len(df):
                continue
            iv = df.iloc[y - 1]["tot"]
            row = st.columns([2] + [2] * len(opp) + [2])
            row[0].write(f"**{y} Jahre**")
            row[1].write(fe(iv))
            for i, (_, od, _) in enumerate(opp):
                ov = od.iloc[y - 1]["netto"]
                d = iv - ov
                color = "🟢" if d >= 0 else "🔴"
                row[i + 2].write(f"{fe(ov)}  {color} Δ {fe(d)}")

        st.divider()
        st.plotly_chart(fig_opportunity(df, opp), use_container_width=True)

    # ── Net return table ──────────────────────────────────────────────────────
    with st.expander("Netto-Renditen Investments"):
        rd = []
        if fg_on:
            fn = fg_r * (1 - ker)
            rd.append({"": "🏦 Festgeld", "Brutto": fp(fg_r),
                       "Eff.Steuer": fp(ker), "Netto p.a.": fp(fn)})
        if etf_on:
            en = etf_r * (1 - ker * 0.7)
            rd.append({"": "📈 ETF", "Brutto": fp(etf_r),
                       "Eff.Steuer": fp(ker * 0.7), "Netto p.a.": fp(en)})
        if reit_on:
            rn = reit_r * (1 - ker * 0.4)
            rd.append({"": "🏠 REIT", "Brutto": fp(reit_r),
                       "Eff.Steuer": fp(ker * 0.4), "Netto p.a.": fp(rn)})
        if rd:
            import pandas as pd
            st.dataframe(pd.DataFrame(rd), use_container_width=True, hide_index=True)

import streamlit as st
import pandas as pd
from calculator import fe, fp, run, find_be, tornado_analysis
from components.charts import fig_tornado


@st.cache_data(show_spinner=False)
def _cached_tornado(A_frozen):
    return tornado_analysis(dict(A_frozen))


@st.cache_data(show_spinner=False)
def _cached_be_km(A_frozen, kp):
    return find_be("km", 0, kp / 5, 1, dict(A_frozen))


@st.cache_data(show_spinner=False)
def _cached_be_z1(A_frozen):
    return find_be("z1", 0, 0.15, 10000, dict(A_frozen))


@st.cache_data(show_spinner=False)
def _sensitivity(A_frozen, km, z1, kp, wst, t1):
    A = dict(A_frozen)
    base_cfn = run(**A)[1]["cfn"]
    base_10 = run(**A)[0].iloc[9]["tot"]
    params = [
        ("Kaltmiete", "km", [km - 200, km - 100, km, km + 100, km + 200], "€"),
        ("Bankzins", "z1", [max(0, z1 - 0.02), max(0, z1 - 0.01), z1, z1 + 0.01, z1 + 0.02], "%"),
        ("Kaufpreis", "kp", [kp - 50000, kp - 25000, kp, kp + 25000, kp + 50000], "€"),
        ("Wertsteigerung", "wst", [0, 0.01, wst, 0.03, 0.04], "%"),
        ("Tilgung", "t1", [0.005, 0.01, 0.015, 0.02, 0.03], "%"),
    ]
    rows = []
    for nm, k, vals, u in params:
        for v in vals:
            try:
                df2, s2 = run(**{**A, k: v})
                t10 = df2.iloc[9]["tot"]
                lbl = f"{v * 100:.2f}%" if u == "%" else fe(v)
                marker = "◄" if abs(v - A.get(k, 0)) < 1e-9 else ""
                rows.append({
                    "Parameter": nm, "Wert": lbl,
                    "CF/M": f"{s2['cfn']:,.0f} €",
                    "Δ CF": f"{s2['cfn'] - base_cfn:+,.0f} €",
                    "Verm. 10J": f"{t10:,.0f} €",
                    "Δ Verm.": f"{t10 - base_10:+,.0f} €",
                    "": marker,
                })
            except Exception:
                pass
    return rows


def render(df, s, inputs, A):
    A_frozen = tuple(sorted(A.items()))

    # ── Breakevens ───────────────────────────────────────────────────────────
    st.subheader("Breakeven-Analyse")
    be_km = _cached_be_km(A_frozen, inputs["kp"])
    be_z1 = _cached_be_z1(A_frozen)

    col1, col2 = st.columns(2)
    with col1:
        st.markdown("**Breakeven Kaltmiete**")
        st.metric("Deine Miete", fe(inputs["km"]))
        st.metric("Breakeven-Miete", fe(be_km) if be_km else "—")
        if be_km and inputs["km"] > 0:
            puffer = (inputs["km"] - be_km) / inputs["km"]
            if puffer > 0.15:
                st.success(f"Guter Puffer: {fp(puffer)}")
            elif puffer > 0:
                st.warning(f"Knapper Puffer: {fp(puffer)}")
            else:
                st.error("Unter Breakeven")

    with col2:
        st.markdown("**Breakeven Zinssatz**")
        st.metric("Dein Zins", fp(inputs["z1"]))
        st.metric("Breakeven-Zins", fp(be_z1) if be_z1 else "—")
        if be_z1:
            puffer = be_z1 - inputs["z1"]
            if puffer > 0.015:
                st.success(f"Solider Zinspuffer: +{fp(puffer)}")
            elif puffer > 0.005:
                st.warning(f"Moderater Puffer: +{fp(puffer)}")
            else:
                st.error("Kaum Zinspuffer")

    st.divider()

    # ── Tornado ──────────────────────────────────────────────────────────────
    st.subheader("Was bewegt den Cashflow?")
    with st.spinner("Berechne Sensitivitäten…"):
        tn = _cached_tornado(A_frozen)
    col1, col2 = st.columns([3, 1])
    with col1:
        st.plotly_chart(fig_tornado(tn), use_container_width=True)
    with col2:
        st.markdown("**Top Hebel**")
        for label, delta in tn[:5]:
            icon = "↑" if delta > 0 else "↓"
            st.write(f"{icon} **{label}**: {fe(delta)}")

    st.divider()

    # ── Sensitivity table ─────────────────────────────────────────────────────
    with st.expander("Vollständige Sensitivitätstabelle", expanded=False):
        with st.spinner("Berechne Tabelle…"):
            rows = _sensitivity(
                A_frozen, inputs["km"], inputs["z1"],
                inputs["kp"], inputs["wst"], inputs["t1"],
            )
        if rows:
            st.dataframe(pd.DataFrame(rows), use_container_width=True,
                         hide_index=True, height=500)

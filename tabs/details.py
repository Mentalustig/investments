import streamlit as st
import pandas as pd
from calculator import fe, fp


def render(df, s, inputs):
    # ── Tilgungsplan ──────────────────────────────────────────────────────────
    with st.expander("Tilgungsplan (40 Jahre)", expanded=True):
        td = df[["jr", "j", "mi", "wi", "bi", "rm", "co", "st", "cn", "rs", "w", "nv"]].head(40).copy()
        td.columns = ["Jahr", "J", "Miete/M", "Warmm./M", "BWK/M", "Rate/M",
                      "CF op/M", "Steuer/M", "CF nSt/M", "Restschuld", "Wert", "Netto-Verm."]
        for col in td.columns[2:]:
            td[col] = td[col].apply(lambda x: f"{x:,.0f} €")
        st.dataframe(td, use_container_width=True, height=450, hide_index=True)

    # ── Steuer & AfA ──────────────────────────────────────────────────────────
    with st.expander("Steuer & AfA"):
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Grenzsteuersatz", fp(s["gst"]))
            st.metric("AfA-Satz", fp(s["afs"]))
            st.metric("AfA-Basis", fe(s["afb"]))
        with col2:
            st.metric("AfA / Jahr", fe(s["afp"]))
            st.metric("AfA / Monat", fe(s["afm"]))
            st.metric("Steuerersparnis / Monat", fe(s["gst"] * s["afm"]))
        st.info(
            f"Steuerlicher CF: {fe(s['stm'])}/M — "
            f"({'Erstattung' if s['stm'] < 0 else 'Zahlung'})"
        )

    # ── Kaufnebenkosten ───────────────────────────────────────────────────────
    with st.expander("Kaufnebenkosten Aufschlüsselung"):
        kp = inputs["kp"]
        data = {
            "Grunderwerbsteuer": f"{fp(s['gr'])} = {fe(s['gr'] * kp)}",
            "Makler": f"{fp(inputs['mk'])} = {fe(inputs['mk'] * kp)}",
            "Notar": f"{fp(inputs['no'])} = {fe(inputs['no'] * kp)}",
            "Grundbuch": f"{fp(inputs['gb'])} = {fe(inputs['gb'] * kp)}",
            "Gesamt NK": f"{fp(s['nk'] / kp)} = {fe(s['nk'])}",
        }
        for k, v in data.items():
            cols = st.columns([3, 3])
            cols[0].write(k)
            cols[1].write(f"**{v}**")

    # ── CSV Export ────────────────────────────────────────────────────────────
    st.divider()
    csv = df.to_csv(index=False).encode("utf-8")
    st.download_button(
        label="CSV exportieren (60 Jahre)",
        data=csv,
        file_name=f"kalkulation_{inputs.get('adr', 'objekt').replace(' ', '_')}.csv",
        mime="text/csv",
    )
    st.caption("⚠️ Keine Gewähr. Kein Ersatz für Finanz-, Steuer- oder Rechtsberatung.")

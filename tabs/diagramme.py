import streamlit as st
from components.charts import (
    fig_debt_line, fig_value_net_worth,
    fig_cumulative_interest, fig_cashflow_bars,
    fig_debt_repayment,
)


def render(df, s, inputs):
    # ── Row 1: Cashflow ───────────────────────────────────────────────────────
    st.plotly_chart(fig_cashflow_bars(df, s["cfpy"]), use_container_width=True)

    # ── Row 2: Restschuld + Zins/Tilgung ─────────────────────────────────────
    col1, col2 = st.columns(2)
    with col1:
        st.plotly_chart(fig_debt_line(df), use_container_width=True)
    with col2:
        st.plotly_chart(fig_debt_repayment(df), use_container_width=True)

    # ── Row 3: Wert + kumulierter Zins ───────────────────────────────────────
    col1, col2 = st.columns(2)
    with col1:
        st.plotly_chart(fig_value_net_worth(df), use_container_width=True)
    with col2:
        st.plotly_chart(fig_cumulative_interest(df), use_container_width=True)

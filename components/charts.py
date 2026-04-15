"""
All Plotly figure factories. Each function returns a go.Figure, no st.* calls.
"""
import plotly.graph_objects as go
from plotly.subplots import make_subplots

_LAYOUT = dict(
    template="plotly_white",
    font=dict(family="Inter, system-ui, sans-serif", size=12),
    margin=dict(l=10, r=10, t=28, b=10),
    plot_bgcolor="#ffffff",
    paper_bgcolor="#ffffff",
)
GREEN = "#059669"
RED = "#dc2626"
BLUE = "#2563eb"
NAVY = "#1e293b"
SLATE = "#64748b"


def _fig(**kwargs):
    fig = go.Figure()
    fig.update_layout(**{**_LAYOUT, **kwargs})
    return fig


def fig_cashflow_waterfall(s) -> go.Figure:
    km = s["br"] * s.get("kp", 0) / 12 if "kp" in s else 0
    # Reconstruct km from wm - gsm
    km_val = s["wm"] - s.get("gsm_approx", 0)
    labels = ["Kaltmiete", "Nebenkosten", "Hausgeld", "IH-Rücklage", "Zinsen", "Tilgung", "Steuern", "CF netto"]
    values = [
        s["wm"] - s.get("bg_ohne_um", s["bg"]),  # Kaltmiete approx
        0,  # placeholder, recalculated below
        -s["bg"] + s["ihm"] + s["mam"],
        -s["ihm"],
        -s["zm"],
        -s["tm"],
        -s["stm"],
        0,
    ]
    # Simpler: use the same waterfall as original
    wm = s["wm"]
    hg_ihm_mam = s["bg"] - (s["wm"] - s["wm"])  # bg contains gsm+hg+ihm+mam
    # Reconstruct: wm = km + gsm; bg = gsm + hg + ihm + mam
    # We don't store km/gsm individually in s, use cfop
    wl = ["Kaltmiete", "+ Nebenkosten", "- Hausgeld/IH", "- Zinsen", "- Tilgung", "- Steuern", "= CF netto"]
    cfop_pre_tax = s["cfop"] + s["stm"]  # before tax
    wv = [
        s["wm"],
        0,
        -(s["bg"] - 0),
        -s["zm"],
        -s["tm"],
        -s["stm"],
        0,
    ]
    wv[1] = 0
    wv[-1] = s["cfn"]

    # Clean waterfall
    x_labels = ["Warmmiete", "BWK", "Zinsen", "Tilgung", "Steuern", "CF netto"]
    y_values = [s["wm"], -s["bg"], -s["zm"], -s["tm"], -s["stm"], 0]
    y_values[-1] = s["cfn"]
    measures = ["relative"] * 5 + ["total"]

    fig = go.Figure(go.Waterfall(
        x=x_labels,
        y=y_values,
        measure=measures,
        connector=dict(line=dict(color="#e2e8f0", width=1)),
        increasing=dict(marker_color=GREEN),
        decreasing=dict(marker_color=RED),
        totals=dict(marker_color=BLUE),
        textposition="outside",
        text=[f"{v:+,.0f} €" for v in y_values],
        textfont=dict(size=11),
    ))
    fig.update_layout(**_LAYOUT, height=300, title_text="Cashflow / Monat", title_font_size=13)
    fig.update_yaxes(tickformat=",", ticksuffix=" €")
    return fig


def fig_invest_pie(s, kp, nk, inv) -> go.Figure:
    labels, values = ["Kaufpreis", "Nebenkosten"], [kp, nk]
    colors = [NAVY, RED]
    if inv > 0:
        labels.append("Invest.")
        values.append(inv)
        colors.append(SLATE)
    fig = go.Figure(go.Pie(
        labels=labels, values=values,
        marker=dict(colors=colors),
        textinfo="label+value",
        texttemplate="%{label}<br>%{value:,.0f} €",
        hole=0.35,
    ))
    fig.update_layout(**_LAYOUT, height=260, showlegend=False,
                      title_text="Gesamtinvestition", title_font_size=13)
    return fig


def fig_financing_pie(s, d1, d2s, ek) -> go.Figure:
    labels = ["Darlehen I", "Eigenkapital"]
    values = [d1, ek]
    colors = [NAVY, RED]
    if d2s > 0:
        labels = ["Darlehen I", "Darlehen II", "Eigenkapital"]
        values = [d1, d2s, ek]
        colors = [NAVY, SLATE, RED]
    fig = go.Figure(go.Pie(
        labels=labels, values=values,
        marker=dict(colors=colors),
        textinfo="label+value",
        texttemplate="%{label}<br>%{value:,.0f} €",
        hole=0.35,
    ))
    fig.update_layout(**_LAYOUT, height=260, showlegend=False,
                      title_text="Finanzierungsstruktur", title_font_size=13)
    return fig


def fig_debt_repayment(df) -> go.Figure:
    d = df.head(40)
    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=d["jr"], y=d["ti"] * 12, name="Tilgung",
        marker_color=GREEN, opacity=0.85,
    ))
    fig.add_trace(go.Bar(
        x=d["jr"], y=d["zi"] * 12, name="Zinsen",
        marker_color=RED, opacity=0.85,
    ))
    fig.update_layout(**_LAYOUT, height=300, barmode="stack",
                      title_text="Zins- & Tilgungsentwicklung", title_font_size=13,
                      yaxis=dict(tickformat=",", ticksuffix=" €"),
                      legend=dict(orientation="h", y=-0.15, font_size=11))
    return fig


def fig_debt_line(df) -> go.Figure:
    d = df.head(50)
    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=d["jr"], y=d["rs"],
        name="Restschuld",
        marker_color=NAVY, opacity=0.85,
    ))
    fig.update_layout(**_LAYOUT, height=300,
                      title_text="Entwicklung der Darlehens-Restschuld", title_font_size=13,
                      yaxis=dict(tickformat=",", ticksuffix=" €"),
                      legend=dict(orientation="h", y=-0.15, font_size=11))
    return fig


def fig_value_net_worth(df) -> go.Figure:
    d = df.head(40)
    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=d["jr"], y=d["w"],
        name="Wert der Immobilie",
        marker_color=NAVY, opacity=0.85,
    ))
    fig.add_trace(go.Scatter(
        x=d["jr"], y=d["nv"],
        name="Netto-Vermögen",
        line=dict(color=GREEN, width=2.5),
        mode="lines",
    ))
    fig.update_layout(**_LAYOUT, height=320,
                      title_text="Entwicklung von Wert und Netto-Vermögen", title_font_size=13,
                      yaxis=dict(tickformat=",", ticksuffix=" €"),
                      legend=dict(orientation="h", y=-0.15, font_size=11))
    return fig


def fig_cumulative_interest(df) -> go.Figure:
    d = df.head(50)
    fig = go.Figure(go.Bar(
        x=d["jr"], y=d["kz"],
        marker_color=RED, opacity=0.85,
        name="Kumulierter Zinsaufwand",
    ))
    fig.update_layout(**_LAYOUT, height=280,
                      title_text="Kumulierter Zinsaufwand", title_font_size=13,
                      yaxis=dict(tickformat=",", ticksuffix=" €"),
                      showlegend=False)
    return fig


def fig_cashflow_bars(df, cfpy=None) -> go.Figure:
    d = df.head(30)
    fig = make_subplots(specs=[[{"secondary_y": True}]])
    fig.add_trace(go.Bar(
        x=d["jr"], y=d["cn"],
        name="CF/Monat",
        marker_color=[GREEN if v >= 0 else RED for v in d["cn"]],
        opacity=0.8,
    ), secondary_y=False)
    fig.add_trace(go.Scatter(
        x=d["jr"], y=d["kcf"],
        name="Kumuliert",
        line=dict(color=BLUE, width=2),
    ), secondary_y=True)
    if cfpy:
        fig.add_vline(x=cfpy, line_dash="dash", line_color=GREEN,
                      annotation_text=f"CF+ {cfpy}", annotation_font_size=10)
    fig.update_layout(**_LAYOUT, height=300,
                      title_text="Cashflow-Entwicklung", title_font_size=13,
                      legend=dict(orientation="h", y=-0.15, font_size=11))
    fig.update_yaxes(tickformat=",", ticksuffix=" €", secondary_y=False)
    fig.update_yaxes(tickformat=",", ticksuffix=" €", secondary_y=True)
    return fig


def fig_opportunity(df, opp_list) -> go.Figure:
    d = df.head(35)
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=d["jr"], y=d["tot"],
        name="🏠 Immobilie",
        line=dict(color=BLUE, width=3),
    ))
    colors = ["#94a3b8", "#eab308", "#8b5cf6", "#f97316"]
    for i, (nm, od, _) in enumerate(opp_list):
        fig.add_trace(go.Scatter(
            x=od["jahr"].head(35), y=od["netto"].head(35),
            name=nm,
            line=dict(color=colors[i % len(colors)], width=2),
        ))
    fig.update_layout(**_LAYOUT, height=380,
                      title_text="Vermögensentwicklung im Vergleich", title_font_size=13,
                      yaxis=dict(tickformat=",", ticksuffix=" €"),
                      legend=dict(orientation="h", y=-0.12, font_size=11))
    return fig


def fig_tornado(items) -> go.Figure:
    labels = [t[0] for t in items[:10]]
    values = [t[1] for t in items[:10]]
    fig = go.Figure(go.Bar(
        y=labels, x=values,
        orientation="h",
        marker_color=[GREEN if v > 0 else RED for v in values],
        text=[f"{v:+,.0f} €" for v in values],
        textposition="outside",
        textfont_size=11,
    ))
    fig.update_layout(**_LAYOUT, height=320,
                      title_text="Sensitivität: Δ CF netto / Monat", title_font_size=13,
                      xaxis=dict(title="Δ CF netto / Monat", tickformat=",", ticksuffix=" €"),
                      yaxis=dict(autorange="reversed"))
    return fig

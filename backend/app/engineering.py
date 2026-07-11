"""
Pure engineering calculation functions.

No FastAPI, no I/O — these are plain, testable functions. Every numeric
result the frontend displays anywhere in the app traces back to a function
in this file. Explanations for each are built in app/explain.py so the
"what" (this file) stays separate from the "why" (explain.py).
"""
import math

from app.data import standards as S


def motor_hp(load_tons: float, speed_mpm: float, efficiency: float = S.DEFAULT_EFFICIENCY, factor: float = 1.0) -> float:
    """Mechanical power required to move `load_tons * factor` at `speed_mpm`."""
    load_kg = load_tons * 1000 * factor
    speed_ms = speed_mpm / 60
    power_w = (load_kg * S.GRAVITY * speed_ms) / efficiency
    return power_w / 746.0


def full_load_current(hp: float, voltage: float = S.DEFAULT_VOLTAGE,
                       power_factor: float = S.DEFAULT_POWER_FACTOR,
                       efficiency: float = S.DEFAULT_EFFICIENCY) -> float:
    kw = hp * S.HP_TO_KW
    return (kw * 1000) / (math.sqrt(3) * voltage * power_factor * efficiency)


def select_from_series(value: float, series: list) -> float:
    """Next standard/preferred size at or above `value` from a ratings series."""
    return next((r for r in series if r >= value), series[-1])


def select_contactor(flc: float) -> float:
    required = flc * S.CONTACTOR_MULTIPLIER
    return select_from_series(required, S.CONTACTOR_RATINGS)


def select_mpcb(flc: float) -> float:
    return next((r for r in S.MPCB_RATINGS if r >= flc), S.MPCB_RATINGS[-1])


def select_cable(flc: float, derate: float = S.CABLE_DERATE_FACTOR) -> float:
    required = flc * derate
    for size in S.CABLE_SIZES:
        if S.CABLE_CAPACITY[size] >= required:
            return size
    return S.CABLE_SIZES[-1]


def overload_setting(flc: float) -> float:
    return flc * S.OVERLOAD_SETTING_FACTOR


def dol_inrush(flc: float) -> float:
    return flc * S.DOL_INRUSH_MULTIPLIER


def star_inrush(flc: float) -> float:
    return dol_inrush(flc) / 3.0


def is_star_delta_required(hp: float) -> bool:
    return hp > S.STAR_DELTA_THRESHOLD_HP


def voltage_drop(flc: float, cable_size: float, length_m: float, voltage: float = S.DEFAULT_VOLTAGE):
    r_per_km = S.CABLE_RESISTANCE.get(cable_size, 0.1)
    drop_v = (math.sqrt(3) * flc * r_per_km * length_m) / 1000
    drop_pct = (drop_v / voltage) * 100
    return drop_v, drop_pct


def busbar_vs_stretch(travel_span_m: float):
    stretch_length = travel_span_m * S.STRETCH_WIRE_FACTOR
    recommendation = "busbar" if travel_span_m > S.BUSBAR_SPAN_THRESHOLD_M else "stretch"
    return recommendation, stretch_length


def safety_margin_pct(selected_rating: float, required_rating: float) -> float:
    """How much headroom the selected/standard rating has above the bare requirement."""
    if required_rating <= 0:
        return 0.0
    return ((selected_rating - required_rating) / required_rating) * 100


def sizing_status(margin_pct: float) -> str:
    """Classify a component's sizing margin into an objective status band."""
    if margin_pct < S.MARGIN_UNDERSIZED:
        return "undersized"
    if margin_pct <= S.MARGIN_ADEQUATE_MAX:
        return "adequate"
    if margin_pct <= S.MARGIN_OPTIMAL_MAX:
        return "optimal"
    return "oversized"

"""
Engineering standards, ratings tables and reference constants.

This module is the SINGLE SOURCE OF TRUTH for every engineering constant used
across the API. Nothing in this file is duplicated on the frontend — the
frontend only renders what these endpoints return.
"""

# ── Default assumptions (all overridable per-request) ─────────────────────
DEFAULT_VOLTAGE = 415.0          # V, standard 3-phase industrial supply in India
DEFAULT_POWER_FACTOR = 0.85      # typical industrial squirrel-cage motor PF
DEFAULT_EFFICIENCY = 0.85        # typical motor efficiency assumption (IE2 class, partial load)
STAR_DELTA_THRESHOLD_HP = 5      # IS 13947 practice: DOL above ~5HP causes excessive inrush/voltage dip

# ── Validation bounds ───────────────────────────────────────────────────────
VOLTAGE_MIN, VOLTAGE_MAX = 100.0, 1000.0
PF_MIN, PF_MAX = 0.5, 1.0
EFFICIENCY_MIN, EFFICIENCY_MAX = 0.5, 1.0
LOAD_TONS_MIN, LOAD_TONS_MAX = 0.1, 1000.0
SPEED_MIN, SPEED_MAX = 0.5, 200.0
HP_MIN, HP_MAX = 0.1, 1000.0
CURRENT_MIN, CURRENT_MAX = 0.1, 3000.0
RPM_MIN, RPM_MAX = 200.0, 6000.0
LENGTH_MIN, LENGTH_MAX = 0.5, 2000.0

# ── Conversion constants ───────────────────────────────────────────────────
HP_TO_KW = 0.746
KW_TO_HP = 1.0 / HP_TO_KW
GRAVITY = 9.81

# ── Standard component ratings (IS 60947 / IEC 60947 preferred series) ────
CONTACTOR_RATINGS = [9, 12, 16, 18, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320, 400]
MPCB_RATINGS = [0.63, 1, 1.6, 2.5, 4, 6.3, 10, 16, 25, 32, 40, 50, 63, 80, 100]
CABLE_SIZES = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240]

# 3-core copper armoured cable, current carrying capacity (A) — ground laid, IS 7098
CABLE_CAPACITY = {
    1.5: 15, 2.5: 20, 4: 27, 6: 34, 10: 46,
    16: 61, 25: 80, 35: 99, 50: 119, 70: 151,
    95: 182, 120: 210, 150: 240, 185: 273, 240: 320,
}

# Cable resistance ohm/km at 40°C (approx, copper), used for voltage-drop calc
CABLE_RESISTANCE = {
    1.5: 12.1, 2.5: 7.41, 4: 4.61, 6: 3.08, 10: 1.83,
    16: 1.15, 25: 0.727, 35: 0.524, 50: 0.387, 70: 0.268,
    95: 0.193, 120: 0.153, 150: 0.124, 185: 0.0991, 240: 0.0754,
}

CONTACTOR_MULTIPLIER = 3.0        # contactor rated current >= 3x FLC (AC-3 duty, repeated starting)
CABLE_DERATE_FACTOR = 1.25        # cable capacity >= 1.25x FLC (continuous industrial duty)
OVERLOAD_SETTING_FACTOR = 1.05    # thermal overload set at 105% of FLC
DOL_INRUSH_MULTIPLIER = 6.0       # typical DOL starting current = 6x FLC for cage motors
STRETCH_WIRE_FACTOR = 1.5         # stretch wire length = 1.5x travel span (sag/slack allowance)
BUSBAR_SPAN_THRESHOLD_M = 15      # above this span, rigid busbar is preferred over stretch wire
VOLTAGE_DROP_LIMIT_PCT = 5.0      # IS 732 practical limit for motor circuits

# Safety margin bands used to classify a selected component against the
# minimum it must satisfy. margin_pct = (selected - required) / required * 100
MARGIN_UNDERSIZED = 0        # < this -> undersized (should not occur from these selectors, but
                              # is possible when a user supplies a custom/override rating)
MARGIN_ADEQUATE_MAX = 15      # 0-15%   -> adequate, on the tighter side
MARGIN_OPTIMAL_MAX = 60       # 15-60%  -> optimal design margin
                               # > 60%   -> oversized (cost / space inefficiency)

DUTY_CLASSES = {
    "M3": "Light duty — infrequent use, long rest periods",
    "M4": "Moderate duty — regular use in general workshops",
    "M5": "Heavy duty — intensive use in production facilities",
    "M6": "Very heavy duty — continuous production",
    "M7": "Severe duty — steel plants, foundries",
    "M8": "Extremely severe — 24hr continuous operation",
}

# ── IS / IEC standard references, quoted per calculation family ───────────
STANDARDS = {
    "motor_power": "IS 3177 / IS 807 — EOT crane motor duty rating (mechanical power from load, speed and hoist efficiency).",
    "flc": "IS 325 — full load current of a 3-phase induction motor from rated output, voltage, PF and efficiency.",
    "contactor": "IS/IEC 60947-4-1 — AC-3 utilisation category. Contactor Ie must exceed motor FLC with margin for repeated start/stop and locked-rotor duty typical of crane motions.",
    "mpcb": "IS/IEC 60947-2 — Motor Protection Circuit Breaker sized at (or just above) FLC for combined short-circuit and overload protection.",
    "overload": "IS/IEC 60947-4-1 — thermal overload relay set at 100-110% of motor FLC so it trips on sustained overcurrent but rides through normal starting current.",
    "cable": "IS 7098 / IS 3961 — cable current rating derated for continuous industrial duty and ambient/grouping factors.",
    "voltage_drop": "IS 732 — permissible voltage drop in consumer wiring, practically limited to 5% for motor circuits to avoid starting torque loss.",
    "star_delta": "IS 13947 — star-delta reduces starting line current and torque to 1/3 of DOL by connecting windings in star during start, delta for run.",
    "busbar": "IEC 61439-6 — rigid conductor rail system recommended for long travel spans where trailing/stretch cable would sag or fatigue.",
    "duty_class": "IS 807 / FEM 1.001 — crane classification by duty cycle and load spectrum.",
    "main_incoming": "IS/IEC 60947-2 — main incoming breaker sized above total connected FLC with margin, so it protects the supply cable without nuisance-tripping on simultaneous motor starting.",
}

COMMON_MISTAKES = {
    "flc": [
        "Using nameplate current directly without checking it matches the actual supply voltage.",
        "Forgetting that FLC scales with 1/efficiency and 1/PF — underestimating both inflates the apparent HP needed.",
    ],
    "contactor": [
        "Sizing the contactor at exactly 1x FLC (AC-1 rating) instead of the AC-3 duty a crane motor actually sees.",
        "Ignoring duty-cycle: a motor started/stopped frequently needs a contactor rated for that electrical durability, not just current.",
    ],
    "mpcb": [
        "Setting the MPCB trip current at FLC without margin, causing nuisance tripping on normal starting current.",
        "Confusing MPCB (combined short-circuit + overload) with a plain MCB, which has no adjustable overload element.",
    ],
    "cable": [
        "Sizing cable on FLC alone without the 1.25x continuous-duty derating factor.",
        "Ignoring voltage drop on long runs — a cable can carry the current but still cause excessive volt-drop at the motor.",
    ],
    "star_delta": [
        "Forgetting that starting TORQUE also drops to 1/3, not just current — star-delta is unsuitable for high-inertia or high-friction starts.",
        "Omitting the electrical interlock between star and delta contactors, risking a direct short across the supply.",
    ],
    "voltage_drop": [
        "Calculating voltage drop with single-phase formula on a 3-phase circuit (missing the √3 factor).",
        "Ignoring drop entirely on long travel spans, where cable length is often underestimated.",
    ],
    "main_incoming": [
        "Sizing the main breaker as the sum of individual MPCB ratings instead of the coincident total FLC — crane motions rarely all run at full load simultaneously.",
        "Forgetting margin for the simultaneous starting inrush of more than one motor at once.",
    ],
}

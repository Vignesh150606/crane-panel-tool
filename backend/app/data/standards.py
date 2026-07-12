"""
Engineering standards, ratings tables and reference constants.

This module is the SINGLE SOURCE OF TRUTH for every engineering constant used
across the API. Nothing in this file is duplicated on the frontend — the
frontend only renders what these endpoints return.
"""

# ── Default assumptions (all overridable per-request) ─────────────────────
DEFAULT_VOLTAGE = 415.0          # V, standard 3-phase industrial supply in India
DEFAULT_POWER_FACTOR = 0.85      # typical industrial squirrel-cage motor PF
DEFAULT_IE_CLASS = "IE3"         # BIS IS 12615 mandates IE3 as the minimum for 0.75-375kW motors in India since July 2023
DEFAULT_EFFICIENCY = 0.85        # flat fallback ONLY used if a caller supplies neither ie_class nor a manual override
STAR_DELTA_THRESHOLD_HP = 5      # IS 13947 practice: DOL above ~5HP causes excessive inrush/voltage dip

# ── Motor efficiency by IE class (IEC 60034-30-1:2014, Table 1, 4-pole/50Hz) ──
# Source: ABB Technical Note 9AKK107319 (IEC 60034-30-1 minimum efficiency
# values). These are MINIMUM guaranteed nameplate efficiencies at rated
# (100%) load for continuous S1 duty, 4-pole, 50Hz — the most common crane
# motor construction. Efficiency genuinely rises with motor size (a 0.75kW
# motor and a 90kW motor are NOT equally efficient), so this tool looks up
# the value for the SPECIFIC motor rating rather than using one flat number.
#
# KNOWN SIMPLIFICATION (flagged, not hidden): EOT crane hoist/travel motors
# are usually intermittent duty (S3/S4/S5 per IS 807), not the continuous S1
# duty this IEC table is defined for. S3/S4 nameplate efficiency at a given
# frame size can differ from the S1 IE-class figure below. This table is a
# standard, defensible reference point for preliminary sizing — for a final
# panel design, use the actual efficiency from the selected motor's
# datasheet.
IE_EFFICIENCY_TABLE = {
    # kW: {IE2: %, IE3: %}   (4-pole, 50Hz, minimum nameplate efficiency)
    0.37: {"IE2": 72.7, "IE3": 77.3},
    0.55: {"IE2": 77.1, "IE3": 80.8},
    0.75: {"IE2": 79.6, "IE3": 82.5},
    1.1:  {"IE2": 81.4, "IE3": 84.1},
    1.5:  {"IE2": 82.8, "IE3": 85.3},
    2.2:  {"IE2": 84.3, "IE3": 86.7},
    3.0:  {"IE2": 85.5, "IE3": 87.7},
    4.0:  {"IE2": 86.6, "IE3": 88.6},
    5.5:  {"IE2": 87.7, "IE3": 89.6},
    7.5:  {"IE2": 88.7, "IE3": 90.4},
    11.0: {"IE2": 89.8, "IE3": 91.4},
    15.0: {"IE2": 90.6, "IE3": 92.1},
    18.5: {"IE2": 91.2, "IE3": 92.6},
    22.0: {"IE2": 91.6, "IE3": 93.0},
    30.0: {"IE2": 92.3, "IE3": 93.6},
    37.0: {"IE2": 92.7, "IE3": 93.9},
    45.0: {"IE2": 93.1, "IE3": 94.2},
    55.0: {"IE2": 93.5, "IE3": 94.6},
    75.0: {"IE2": 94.0, "IE3": 95.0},
    90.0: {"IE2": 94.2, "IE3": 95.2},
    110.0: {"IE2": 94.5, "IE3": 95.4},
    132.0: {"IE2": 94.7, "IE3": 95.6},
    160.0: {"IE2": 94.9, "IE3": 95.8},
    200.0: {"IE2": 95.1, "IE3": 96.0},
}
IE_TABLE_KW_POINTS = sorted(IE_EFFICIENCY_TABLE.keys())

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

CONTACTOR_MULTIPLIER = 2.0        # contactor rated current >= 2.0x FLC. Verified against IEC 60947-4-1 AC-3
                                   # sizing practice: standard duty uses a 1.25x margin, heavy-duty frequent
                                   # starting uses 1.5x, and 2.0x is the documented upper bound reserved for
                                   # "severe applications demanding rapid reverse plugging, inching, or jogging" —
                                   # which describes EOT crane hoist/travel duty (frequent, rapid reversing).
                                   # A prior version of this tool used 3.0x with no cited basis; no verified
                                   # industry source supports going that high even for crane duty, so it has
                                   # been corrected down to the documented severe-duty ceiling.
CABLE_DERATE_FACTOR = 1.25        # cable capacity >= 1.25x FLC (continuous industrial duty)
OVERLOAD_SETTING_FACTOR = 1.05    # thermal overload set at 105% of FLC
DOL_INRUSH_MULTIPLIER = 6.0       # typical DOL starting current = 6x FLC for cage motors
STRETCH_WIRE_FACTOR = 1.5         # stretch wire length = 1.5x travel span (sag/slack allowance)
BUSBAR_SPAN_THRESHOLD_M = 15      # above this span, rigid busbar is preferred over stretch wire
VOLTAGE_DROP_LIMIT_PCT = 5.0      # IS 732 practical limit for motor circuits

# Safety margin bands used to classify a selected component against the
# minimum it must satisfy. margin_pct = (selected - required) / required * 100
MARGIN_UNDERSIZED = 0        # < this -> undersized. Verified this DOES occur from
                              # the selectors themselves, not just user overrides:
                              # select_cable/select_mpcb/select_from_series all fall
                              # back to the top of their ratings table when nothing
                              # in the table satisfies the requirement (e.g. FLC above
                              # MPCB_RATINGS[-1] = 100A, reachable with an ordinary
                              # valid input). The frontend now reflects this (StatPlate
                              # tone follows sizing_status instead of a hardcoded
                              # "safe" colour) rather than silently looking fine.
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
    "motor_power": "IS 3177 / IS 807 — EOT crane motor duty rating: required rated output (mechanical) power from load and hoisting/travel speed.",
    "flc": "IS 325 — full load current of a 3-phase induction motor from rated output, voltage, PF and efficiency.",
    "motor_efficiency": "IEC 60034-30-1:2014 — minimum nameplate efficiency by IE class (IE2/IE3) and rated power, 4-pole/50Hz. IE3 has been the mandatory minimum for 0.75-375kW motors in India since July 2023 (BIS IS 12615).",
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
        "Applying efficiency twice — once when sizing the required motor HP from the load, and again when computing FLC from that HP. Efficiency only belongs in the FLC step; it silently oversizes the whole downstream design if applied twice.",
    ],
    "motor_efficiency": [
        "Assuming one flat efficiency (e.g. 85%) for every motor size — small motors are genuinely less efficient than large ones at the same IE class.",
        "Using continuous-duty (S1) IE-class efficiency for a motor that will actually be nameplated for intermittent crane duty (S3/S4) — a reasonable preliminary estimate, but confirm against the selected motor's actual datasheet before finalizing a panel design.",
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

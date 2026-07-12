"""
Builds the "why", not just the "what", for every calculation.

Each function returns a dict shaped like:
{
  "formula": "symbolic formula",
  "variables": [{"symbol": "P", "name": "Power", "value": 12.3, "unit": "kW"}, ...],
  "substitution": "12.3 = (5000 x 9.81 x 0.067) / 0.85",   <- actual numbers from THIS calculation
  "result": "12.3 kW",
  "reasoning": "why this formula / why these numbers, in plain field language",
  "standard": "IS/IEC reference",
  "common_mistakes": ["...", "..."]
}
This is consumed directly by the FormulaExplainer component on the frontend —
nothing here is re-derived or duplicated client-side.
"""
from app.data import standards as S


def _block(formula, variables, substitution, result, reasoning, standard_key, mistakes_key=None):
    return {
        "formula": formula,
        "variables": variables,
        "substitution": substitution,
        "result": result,
        "reasoning": reasoning,
        "standard": S.STANDARDS[standard_key],
        "common_mistakes": S.COMMON_MISTAKES.get(mistakes_key or standard_key, []),
    }


def explain_motor_hp(load_tons, speed_mpm, factor, hp, motion_label):
    load_kg = load_tons * 1000 * factor
    speed_ms = speed_mpm / 60
    return _block(
        formula="HP = (m x g x v) / 746",
        variables=[
            {"symbol": "m", "name": "Load mass", "value": round(load_kg, 1), "unit": "kg"},
            {"symbol": "g", "name": "Gravity", "value": S.GRAVITY, "unit": "m/s^2"},
            {"symbol": "v", "name": "Speed", "value": round(speed_ms, 4), "unit": "m/s"},
        ],
        substitution=f"HP = ({load_kg:.0f} x 9.81 x {speed_ms:.4f}) / 746 = {hp:.2f} HP",
        result=f"{hp:.2f} HP",
        reasoning=(
            f"The {motion_label} motor has to lift/move {load_kg:.0f} kg against gravity at {speed_ms*60:.1f} m/min. "
            "Mechanical power is force x velocity; dividing by 746 converts watts to HP. This is the motor's "
            "required RATED OUTPUT — pure physics, independent of the motor's own electrical efficiency. "
            "Efficiency only enters the picture next, when converting this output rating into the electrical "
            "current the motor draws (see Full Load Current below) — applying it here as well would double-count "
            "it and oversize every downstream component."
        ),
        standard_key="motor_power",
    )


def explain_flc(hp, voltage, power_factor, efficiency, flc, efficiency_source="IE3"):
    kw = hp * S.HP_TO_KW
    eff_note = (
        "manually entered by you"
        if efficiency_source == "manual"
        else f"looked up for a {kw:.2f} kW motor from the IEC 60034-30-1 {efficiency_source} efficiency table"
    )
    return _block(
        formula="FLC = (kW x 1000) / (sqrt3 x V x PF x eta)",
        variables=[
            {"symbol": "kW", "name": "Motor rated output", "value": round(kw, 2), "unit": "kW"},
            {"symbol": "V", "name": "Line voltage", "value": voltage, "unit": "V"},
            {"symbol": "PF", "name": "Power factor", "value": power_factor, "unit": ""},
            {"symbol": "eta", "name": "Motor efficiency", "value": round(efficiency, 3), "unit": ""},
        ],
        substitution=f"FLC = ({kw:.2f} x 1000) / (1.732 x {voltage} x {power_factor} x {efficiency:.3f}) = {flc:.2f} A",
        result=f"{flc:.2f} A",
        reasoning=(
            "Every downstream component (contactor, MPCB, cable) is sized off this one number, so it's the most "
            "important intermediate result in the whole design. The sqrt(3) term appears because this is a "
            "3-phase circuit — line current relates to power through the phase voltage AND the 120 degree phase "
            f"offset between the three lines, not a simple single-phase P=VI. Efficiency here was {eff_note}: "
            "smaller motors are genuinely less efficient than larger ones, so this tool looks up the real "
            "IEC value for THIS motor's size rather than assuming one flat number for every rating."
        ),
        standard_key="flc",
    )


def explain_contactor(flc, required, rating):
    return _block(
        formula="Ie(contactor) >= 2.0 x FLC",
        variables=[
            {"symbol": "FLC", "name": "Full load current", "value": round(flc, 2), "unit": "A"},
        ],
        substitution=f"2.0 x {flc:.2f} = {required:.2f} A -> next standard size = {rating} A",
        result=f"{rating} A",
        reasoning=(
            "A crane hoist/travel motor is reversed and jogged constantly, and briefly sees 6-8x FLC every time "
            "it starts. A contactor sized at exactly 1x FLC (a light general-duty margin) would weld or wear out "
            "its contacts under that duty. Industry sizing guides define a graduated safety margin by duty "
            "severity: about 1.25x FLC for light-duty continuous loads, 1.5x for heavy-duty frequent starting, "
            "and up to 2.0x for the most severe category — rapid reversing, jogging or plugging — which is "
            "exactly what a crane hoist/travel contactor does. 2.0x is the documented ceiling for that category, "
            "not an arbitrary round number."
        ),
        standard_key="contactor",
    )


def explain_mpcb(flc, rating):
    return _block(
        formula="MPCB rating >= FLC",
        variables=[{"symbol": "FLC", "name": "Full load current", "value": round(flc, 2), "unit": "A"}],
        substitution=f"MPCB >= {flc:.2f} A -> next standard size = {rating} A",
        result=f"{rating} A",
        reasoning=(
            "Unlike the contactor, the MPCB's job is protection, not switching — it must trip on a genuine "
            "overload or short circuit but stay closed through normal starting current, so it's set at (or just "
            "above) FLC rather than multiplied up like the contactor."
        ),
        standard_key="mpcb",
    )


def explain_overload(flc, setting):
    return _block(
        formula="Overload setting = 1.05 x FLC",
        variables=[{"symbol": "FLC", "name": "Full load current", "value": round(flc, 2), "unit": "A"}],
        substitution=f"1.05 x {flc:.2f} = {setting:.2f} A",
        result=f"{setting:.2f} A",
        reasoning=(
            "Set just above FLC (not at it) so the relay doesn't nuisance-trip on normal load fluctuation, "
            "but still trips promptly if the motor sustains current above its rated draw — the usual sign of "
            "a mechanical jam or single-phasing."
        ),
        standard_key="overload",
    )


def explain_cable(flc, required, size):
    return _block(
        formula="Cable capacity >= 1.25 x FLC",
        variables=[{"symbol": "FLC", "name": "Full load current", "value": round(flc, 2), "unit": "A"}],
        substitution=f"1.25 x {flc:.2f} = {required:.2f} A -> {size} mm^2 (rated {S.CABLE_CAPACITY[size]} A)",
        result=f"{size} mm^2",
        reasoning=(
            "The 25% margin covers continuous industrial duty derating (ambient temperature, grouping with "
            "other cables in the same duct) so the cable's actual carrying capacity in service — not its "
            "datasheet figure in free air — stays above the motor's full load current."
        ),
        standard_key="cable",
    )


def explain_voltage_drop(flc, cable_size, length, voltage, drop_v, drop_pct):
    r = S.CABLE_RESISTANCE.get(cable_size, 0.1)
    return _block(
        formula="Vdrop = (sqrt3 x I x R x L) / 1000",
        variables=[
            {"symbol": "I", "name": "Current", "value": round(flc, 2), "unit": "A"},
            {"symbol": "R", "name": "Cable resistance", "value": r, "unit": "ohm/km"},
            {"symbol": "L", "name": "Run length", "value": length, "unit": "m"},
        ],
        substitution=f"Vdrop = (1.732 x {flc:.2f} x {r} x {length}) / 1000 = {drop_v:.2f} V ({drop_pct:.2f}%)",
        result=f"{drop_v:.2f} V ({drop_pct:.2f}%)",
        reasoning=(
            "A cable can be rated to carry the current safely and still cause too much voltage drop over a long "
            "run. Motors are sensitive to undervoltage at the terminals — starting torque falls with the square "
            "of the voltage, so a 10% volt-drop can mean a ~19% torque loss right when the motor needs it most."
        ),
        standard_key="voltage_drop",
    )


def explain_star_delta(hp, flc, dol, star, timer_s):
    return _block(
        formula="I(star) = I(DOL) / 3, T(star) = T(DOL) / 3",
        variables=[
            {"symbol": "I(DOL)", "name": "DOL inrush", "value": round(dol, 1), "unit": "A"},
            {"symbol": "HP", "name": "Motor rating", "value": hp, "unit": "HP"},
        ],
        substitution=f"{dol:.1f} / 3 = {star:.1f} A starting current, timer set to {timer_s}s star duration",
        result=f"{star:.1f} A ({(100 - star/dol*100):.0f}% lower than DOL)",
        reasoning=(
            "Connecting the windings in star during start applies only the phase voltage (V/sqrt3) across each "
            "winding instead of the full line voltage, which cuts starting current AND torque to a third of "
            "direct-on-line. The timer must run long enough for the motor to reach near-full speed in star "
            "before switching to delta, otherwise the transition itself causes a second current spike."
        ),
        standard_key="star_delta",
    )


def explain_main_incoming(motor_flcs, total_flc, rating):
    terms = " + ".join(f"{flc:.1f}" for flc in motor_flcs)
    return _block(
        formula="Main breaker >= 1.25 x sum(FLC of all motors)",
        variables=[{"symbol": "sum(FLC)", "name": "Total connected FLC", "value": round(total_flc, 2), "unit": "A"}],
        substitution=f"1.25 x ({terms}) = 1.25 x {total_flc:.2f} = {total_flc*1.25:.2f} A -> next standard size = {rating} A",
        result=f"{rating} A",
        reasoning=(
            "Sized on the sum of all three motor FLCs (not their individual MPCBs) because the main breaker only "
            "needs to protect the incoming supply cable — a 25% margin covers simultaneous starting inrush "
            "without forcing an oversized, expensive frame size."
        ),
        standard_key="main_incoming",
    )


def explain_busbar_vs_stretch(travel_span, stretch_length, recommendation):
    return _block(
        formula="Stretch wire length = 1.5 x travel span",
        variables=[{"symbol": "L", "name": "Travel span", "value": travel_span, "unit": "m"}],
        substitution=f"1.5 x {travel_span} = {stretch_length:.1f} m",
        result=recommendation.upper(),
        reasoning=(
            f"Below ~{S.BUSBAR_SPAN_THRESHOLD_M}m, a trailing stretch cable is simple and cheap. Beyond that, "
            "cable weight causes sag that increases mechanical stress on the cable and its end fixings every "
            "single traverse — a rigid busbar with spring-loaded collector shoes trades higher install cost for "
            "near-zero mechanical wear over the crane's life."
        ),
        standard_key="busbar",
    )

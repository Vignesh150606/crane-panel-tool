from fastapi import APIRouter

from app.models import BOMMotorSet
from app.data import standards as S
from app import engineering as E
from app import explain as X
from app import status as ST

router = APIRouter(prefix="/api", tags=["bom"])


@router.post("/bom")
def generate_bom(req: BOMMotorSet):
    voltage = req.voltage or S.DEFAULT_VOLTAGE
    pf = req.power_factor or S.DEFAULT_POWER_FACTOR
    eff = req.efficiency or S.DEFAULT_EFFICIENCY

    motors = {"Hoist": req.hoist_hp, "Long Travel": req.lt_hp, "Cross Travel": req.ct_hp}
    items = []
    sl = 1

    def add(component, spec, qty, unit, purpose):
        nonlocal sl
        items.append({"slNo": sl, "component": component, "spec": spec, "qty": qty, "unit": unit, "purpose": purpose})
        sl += 1

    flcs = {name: E.full_load_current(hp, voltage, pf, eff) for name, hp in motors.items()}
    total_flc = sum(flcs.values())
    main_required = total_flc * S.CABLE_DERATE_FACTOR
    main_mcb = E.select_from_series(main_required, S.CONTACTOR_RATINGS)
    add("Main MCB", f"{main_mcb}A, 3-pole, {voltage:.0f}V", 1, "No", "Main incoming protection")

    add("Single Phase Preventer (SPP)", f"{voltage:.0f}V, 3-phase, with phase sequence protection", 1, "No", "Phase loss / reversal protection")
    add("Control Transformer", f"{voltage:.0f}V / 110V, suitable VA rating", 1, "No", "Contactor coil supply (110V AC)")

    explanations = {
        "main_mcb": X.explain_main_incoming(list(flcs.values()), total_flc, main_mcb),
    }
    per_motor = {}

    for name, hp in motors.items():
        flc = flcs[name]
        cont_required = flc * S.CONTACTOR_MULTIPLIER
        cont_rating = E.select_contactor(flc)
        mpcb_rating = E.select_mpcb(flc)
        cable_size = E.select_cable(flc)
        cable_required = flc * S.CABLE_DERATE_FACTOR
        star_delta = E.is_star_delta_required(hp)
        kw = hp * S.HP_TO_KW

        add(f"MPCB — {name}", f"{mpcb_rating}A, adjustable, {voltage:.0f}V", 1, "No", f"Overload & SC protection for {name} motor")
        add(f"Contactor — {name} (pair)", f"{cont_rating}A, {voltage:.0f}V coil 110V AC", 2, "No", "Direction control (Fwd/Rev) with interlock")
        add(f"Overload Relay — {name}", f"Adjustable, set at {flc:.1f}A FLC", 1, "No", f"Thermal protection for {name} motor")
        add(f"Power Cable — {name}", f"{cable_size} mm\u00b2 4-core copper armoured", 1, "Lot", f"Supply to {name} motor ({kw:.1f} kW / {hp} HP)")

        if star_delta:
            add(f"Star-Delta Starter — {name}", "Auto star-delta, {:.0f}V, timer-based".format(voltage), 1, "No", f"Reduced voltage starting for {hp} HP motor")

        per_motor[name] = {
            "flc": round(flc, 2),
            "status": {
                "contactor": ST.build_status(cont_rating, cont_required, "contactor"),
                "mpcb": ST.build_status(mpcb_rating, flc, "mpcb"),
                "cable": ST.build_status(S.CABLE_CAPACITY[cable_size], cable_required, "cable", unit="A"),
            },
            "explanations": {
                "contactor": X.explain_contactor(flc, cont_required, cont_rating),
                "mpcb": X.explain_mpcb(flc, mpcb_rating),
                "cable": X.explain_cable(flc, cable_required, cable_size),
            },
        }

    add("8-pin Relay with socket", "24V DC coil, 10A contacts", 6, "No", "Interlock logic — 2 per motion (LT/CT/Hoist)")
    add("14-pin Relay with socket", "24V DC coil, 10A contacts", 3, "No", "Auxiliary control and indicator logic")
    add("DIN Rail", "35mm standard, 1m length", 3, "Pcs", "Component mounting")
    add("Cable Duct", "40x40mm PVC with cover", 5, "Mtr", "Wire routing and management")
    add("Terminal Block (10A)", "Screw type, 4mm\u00b2", 50, "No", "Wire termination points")
    add("Cable Gland", "M20, IP55", 8, "No", "Panel entry points for cables")
    add("Push Button (NO)", "22mm, green, {:.0f}V".format(voltage), 6, "No", "Start/direction control — LT/CT/Hoist")
    add("Push Button (NC)", "22mm, red, Emergency Stop", 2, "No", "E-Stop and Stop control")
    add("Limit Switch", "15A, IP55, with roller", 6, "No", "Travel limit protection — 2 per motion")
    add("Pendant Control Station", "6-button + E-Stop, 10m cable", 1, "No", "Operator control pendant")

    recommendation, stretch_length = E.busbar_vs_stretch(req.travel_length)
    wire_length = round(req.travel_length * S.STRETCH_WIRE_FACTOR + 0.5)
    add("Supply Cable (stretch/busbar)", f"{wire_length}m for {req.travel_length:.0f}m travel span, system: {recommendation}",
        wire_length, "Mtr", "Power supply to moving crane (1.5x travel length)")

    return {
        "items": items,
        "total_flc": round(total_flc, 2),
        "main_mcb": main_mcb,
        "per_motor": per_motor,
        "explanations": explanations,
    }

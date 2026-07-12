from fastapi import APIRouter

from app.models import MotorCalcRequest, NameplateCalcRequest, StarDeltaRequest
from app.data import standards as S
from app import engineering as E
from app import explain as X
from app import status as ST

router = APIRouter(prefix="/api", tags=["calculations"])


def _resolve(value, default):
    """Return (value, was_provided) — was_provided is False when the client omitted the field."""
    if value is None:
        return default, False
    return value, True


def _resolve_efficiency(hp, ie_class, manual_efficiency):
    """Manual efficiency override wins if supplied; otherwise look up the
    IEC 60034-30-1 efficiency for a motor of THIS hp rating and IE class
    (falls back to the India-mandated default IE3 if ie_class is omitted)."""
    if manual_efficiency is not None:
        return manual_efficiency, "manual"
    resolved_class = ie_class or S.DEFAULT_IE_CLASS
    return E.motor_efficiency_for_rating(hp, resolved_class), resolved_class


def _motor_branch(label, load_tons, speed_mpm, load_factor, voltage, pf, ie_class, manual_efficiency, hp_override=None):
    if hp_override is not None:
        hp = hp_override
        motor_hp_explanation = None
    else:
        hp = E.motor_hp(load_tons, speed_mpm, load_factor)
        motor_hp_explanation = X.explain_motor_hp(load_tons, speed_mpm, load_factor, hp, label)

    efficiency, eff_source = _resolve_efficiency(hp, ie_class, manual_efficiency)
    flc = E.full_load_current(hp, voltage, pf, efficiency)
    cont_required = flc * S.CONTACTOR_MULTIPLIER
    cont_rating = E.select_contactor(flc)
    mpcb_rating = E.select_mpcb(flc)
    cable_required = flc * S.CABLE_DERATE_FACTOR
    cable_size = E.select_cable(flc)
    overload = E.overload_setting(flc)
    star_delta = E.is_star_delta_required(hp)

    explanations = {
        "flc": X.explain_flc(hp, voltage, pf, efficiency, flc, eff_source),
        "contactor": X.explain_contactor(flc, cont_required, cont_rating),
        "mpcb": X.explain_mpcb(flc, mpcb_rating),
        "overload": X.explain_overload(flc, overload),
        "cable": X.explain_cable(flc, cable_required, cable_size),
    }
    if motor_hp_explanation:
        explanations["motor_hp"] = motor_hp_explanation

    return {
        "label": label,
        "hp": round(hp, 2),
        "kw": round(hp * S.HP_TO_KW, 2),
        "flc": round(flc, 2),
        "efficiency_pct": round(efficiency * 100, 1),
        "efficiency_source": eff_source,
        "contactor_rating": cont_rating,
        "mpcb_rating": mpcb_rating,
        "overload_setting": round(overload, 2),
        "cable_size": cable_size,
        "star_delta_required": star_delta,
        "hp_was_override": hp_override is not None,
        "explanations": explanations,
        "status": {
            "contactor": ST.build_status(cont_rating, cont_required, "contactor"),
            "mpcb": ST.build_status(mpcb_rating, flc, "mpcb"),
            "cable": ST.build_status(S.CABLE_CAPACITY[cable_size], cable_required, "cable", unit="A"),
        },
    }


@router.post("/motor")
def calculate_motor(req: MotorCalcRequest):
    voltage, v_provided = _resolve(req.voltage, S.DEFAULT_VOLTAGE)
    pf, pf_provided = _resolve(req.power_factor, S.DEFAULT_POWER_FACTOR)
    ie_provided = req.ie_class is not None or req.efficiency is not None

    hoist = _motor_branch("Hoist", req.load_tons, req.hoist_speed, 1.0, voltage, pf, req.ie_class, req.efficiency, req.hoist_hp_override)
    lt = _motor_branch("Long Travel", req.load_tons, req.lt_speed, req.lt_load_factor, voltage, pf, req.ie_class, req.efficiency, req.lt_hp_override)
    ct = _motor_branch("Cross Travel", req.load_tons, req.ct_speed, req.ct_load_factor, voltage, pf, req.ie_class, req.efficiency, req.ct_hp_override)

    return {
        "motors": {"hoist": hoist, "lt": lt, "ct": ct},
        "assumptions": [
            ST.assumed_or_computed("voltage", voltage, v_provided, "V"),
            ST.assumed_or_computed("power_factor", pf, pf_provided, ""),
            ST.assumed_or_computed("ie_class", req.efficiency if req.efficiency is not None else (req.ie_class or S.DEFAULT_IE_CLASS), ie_provided, ""),
        ],
    }


@router.post("/nameplate")
def calculate_nameplate(req: NameplateCalcRequest):
    hp = req.hp if req.use_hp else req.kw * S.KW_TO_HP
    kw = hp * S.HP_TO_KW
    flc = req.current

    cont_required = flc * S.CONTACTOR_MULTIPLIER
    cont_rating = E.select_contactor(flc)
    mpcb_rating = E.select_mpcb(flc)
    cable_required = flc * S.CABLE_DERATE_FACTOR
    cable_size = E.select_cable(flc)
    overload = E.overload_setting(flc)
    star_delta = E.is_star_delta_required(hp)
    dol = E.dol_inrush(flc)
    star = E.star_inrush(flc)

    result = {
        "hp": round(hp, 2),
        "kw": round(kw, 2),
        "flc": round(flc, 2),
        "contactor_rating": cont_rating,
        "mpcb_rating": mpcb_rating,
        "overload_setting": round(overload, 2),
        "cable_size": cable_size,
        "star_delta_required": star_delta,
        "dol_inrush": round(dol, 1),
        "star_inrush": round(star, 1),
        "explanations": {
            "contactor": X.explain_contactor(flc, cont_required, cont_rating),
            "mpcb": X.explain_mpcb(flc, mpcb_rating),
            "overload": X.explain_overload(flc, overload),
            "cable": X.explain_cable(flc, cable_required, cable_size),
        },
        "status": {
            "contactor": ST.build_status(cont_rating, cont_required, "contactor"),
            "mpcb": ST.build_status(mpcb_rating, flc, "mpcb"),
            "cable": ST.build_status(S.CABLE_CAPACITY[cable_size], cable_required, "cable", unit="A"),
        },
    }
    if star_delta:
        result["explanations"]["star_delta"] = X.explain_star_delta(hp, flc, dol, star, 5)
    return result


@router.post("/star-delta")
def calculate_star_delta(req: StarDeltaRequest):
    voltage, _ = _resolve(req.voltage, S.DEFAULT_VOLTAGE)
    pf, _ = _resolve(req.power_factor, S.DEFAULT_POWER_FACTOR)
    eff, _eff_source = _resolve_efficiency(req.hp, req.ie_class, req.efficiency)

    flc = E.full_load_current(req.hp, voltage, pf, eff)
    dol = E.dol_inrush(flc)
    star = E.star_inrush(flc)
    required = E.is_star_delta_required(req.hp)

    return {
        "flc": round(flc, 2),
        "dol_inrush": round(dol, 1),
        "star_inrush": round(star, 1),
        "star_torque_pct": round((1 / 3) * 100, 1),
        "current_reduction_pct": round(100 - (star / dol * 100), 1),
        "required": required,
        "explanations": {
            "star_delta": X.explain_star_delta(req.hp, flc, dol, star, req.timer_seconds),
        },
    }

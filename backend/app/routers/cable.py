from fastapi import APIRouter

from app.models import CableSizingRequest
from app.data import standards as S
from app import engineering as E
from app import explain as X
from app import status as ST

router = APIRouter(prefix="/api", tags=["cable"])


@router.post("/cable-busbar")
def calculate_cable_busbar(req: CableSizingRequest):
    voltage = req.voltage or S.DEFAULT_VOLTAGE
    required = req.flc * S.CABLE_DERATE_FACTOR
    cable_size = E.select_cable(req.flc)
    drop_v, drop_pct = E.voltage_drop(req.flc, cable_size, req.length, voltage)
    recommendation, stretch_length = E.busbar_vs_stretch(req.travel_length)

    return {
        "cable_size": cable_size,
        "cable_capacity": S.CABLE_CAPACITY[cable_size],
        "voltage_drop_v": round(drop_v, 2),
        "voltage_drop_pct": round(drop_pct, 2),
        "voltage_drop_exceeds_limit": drop_pct > S.VOLTAGE_DROP_LIMIT_PCT,
        "voltage_drop_limit_pct": S.VOLTAGE_DROP_LIMIT_PCT,
        "recommendation": recommendation,
        "stretch_wire_length": round(stretch_length, 1),
        "busbar_span_threshold_m": S.BUSBAR_SPAN_THRESHOLD_M,
        "explanations": {
            "cable": X.explain_cable(req.flc, required, cable_size),
            "voltage_drop": X.explain_voltage_drop(req.flc, cable_size, req.length, voltage, drop_v, drop_pct),
            "busbar": X.explain_busbar_vs_stretch(req.travel_length, stretch_length, recommendation),
        },
        "status": {
            "cable": ST.build_status(S.CABLE_CAPACITY[cable_size], required, "cable", unit="A"),
        },
    }

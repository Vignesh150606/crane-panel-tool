from fastapi import APIRouter
from pydantic import BaseModel
import math

router = APIRouter(prefix="/api", tags=["Calculations"])

VOLTAGE = 415
PF = 0.85
EFFICIENCY = 0.85
CONTACTOR_RATINGS = [9,12,16,18,25,32,40,50,63,80,100,125,160,200,250,320,400]
MPCB_RATINGS = [0.63,1,1.6,2.5,4,6.3,10,16,25,32,40,50,63,80,100]
CABLE_SIZES = [1.5,2.5,4,6,10,16,25,35,50,70,95,120]
CABLE_CAPACITY = {1.5:15,2.5:20,4:27,6:34,10:46,16:61,25:80,35:99,50:119,70:151,95:182,120:210}

class MotorInput(BaseModel):
    load_tons: float
    hoist_speed: float
    lt_speed: float
    ct_speed: float

class NameplateInput(BaseModel):
    voltage: float = 415
    current: float
    hp: float = 0
    kw: float = 0
    use_hp: bool = True

def calc_flc(hp):
    kw = hp * 0.746
    return (kw * 1000) / (math.sqrt(3) * VOLTAGE * PF * EFFICIENCY)

def select_contactor(flc):
    req = flc * 3
    return next((r for r in CONTACTOR_RATINGS if r >= req), CONTACTOR_RATINGS[-1])

def select_mpcb(flc):
    return next((r for r in MPCB_RATINGS if r >= flc), MPCB_RATINGS[-1])

def select_cable(flc):
    for size in CABLE_SIZES:
        if CABLE_CAPACITY[size] >= flc * 1.25:
            return size
    return CABLE_SIZES[-1]

@router.get("/ping")
def ping():
    return {"message": "API working"}

@router.post("/calculate-motor")
def calculate_motor(data: MotorInput):
    def calc_hp(load_tons, speed_mpm, factor=1.0):
        load_kg = load_tons * 1000 * factor
        speed_ms = speed_mpm / 60
        power_w = (load_kg * 9.81 * speed_ms) / EFFICIENCY
        return power_w / 746

    motors = {
        "hoist": calc_hp(data.load_tons, data.hoist_speed),
        "lt": calc_hp(data.load_tons, data.lt_speed, 0.1),
        "ct": calc_hp(data.load_tons, data.ct_speed, 0.05)
    }

    results = {}
    for name, hp in motors.items():
        flc = calc_flc(hp)
        results[name] = {
            "hp": round(hp, 2),
            "kw": round(hp * 0.746, 2),
            "flc": round(flc, 2),
            "contactor": select_contactor(flc),
            "mpcb": select_mpcb(flc),
            "cable": select_cable(flc),
            "star_delta": hp > 5
        }

    return results

@router.post("/calculate-nameplate")
def calculate_nameplate(data: NameplateInput):
    hp = data.hp if data.use_hp else data.kw / 0.746
    flc = data.current
    return {
        "hp": round(hp, 2),
        "kw": round(hp * 0.746, 2),
        "flc": round(flc, 2),
        "contactor": select_contactor(flc),
        "mpcb": select_mpcb(flc),
        "overload_setting": round(flc * 1.05, 1),
        "cable": select_cable(flc),
        "star_delta": hp > 5,
        "inrush": round(flc * 6, 1),
        "star_inrush": round(flc * 6 / 3, 1)
    }
"""
Request models with validation.

Every numeric field has an engineering-plausible bound (see app/data/standards.py)
so the API rejects negative loads, impossible voltages, out-of-range PF/efficiency,
etc. with a clear message instead of silently producing nonsense output.
"""
from typing import Optional
from pydantic import BaseModel, Field, field_validator

from app.data import standards as S


class MotorCalcRequest(BaseModel):
    load_tons: float = Field(..., gt=0, le=S.LOAD_TONS_MAX, description="Load to be lifted/moved, in tonnes")
    hoist_speed: float = Field(..., gt=0, le=S.SPEED_MAX, description="Hoist speed, m/min")
    lt_speed: float = Field(..., gt=0, le=S.SPEED_MAX, description="Long travel speed, m/min")
    ct_speed: float = Field(..., gt=0, le=S.SPEED_MAX, description="Cross travel speed, m/min")
    lt_load_factor: float = Field(default=0.1, gt=0, le=1, description="Fraction of hook load LT motor must move (crane self-weight share)")
    ct_load_factor: float = Field(default=0.05, gt=0, le=1, description="Fraction of hook load CT motor must move (crab self-weight share)")
    voltage: Optional[float] = Field(default=None, ge=S.VOLTAGE_MIN, le=S.VOLTAGE_MAX)
    power_factor: Optional[float] = Field(default=None, ge=S.PF_MIN, le=S.PF_MAX)
    efficiency: Optional[float] = Field(default=None, ge=S.EFFICIENCY_MIN, le=S.EFFICIENCY_MAX)
    hoist_hp_override: Optional[float] = Field(default=None, gt=0, le=S.HP_MAX, description="Skip the mechanical HP calc and use this HP directly")
    lt_hp_override: Optional[float] = Field(default=None, gt=0, le=S.HP_MAX)
    ct_hp_override: Optional[float] = Field(default=None, gt=0, le=S.HP_MAX)


class NameplateCalcRequest(BaseModel):
    voltage: float = Field(..., ge=S.VOLTAGE_MIN, le=S.VOLTAGE_MAX)
    current: float = Field(..., gt=0, le=S.CURRENT_MAX)
    use_hp: bool = True
    hp: Optional[float] = Field(default=None, gt=0, le=S.HP_MAX)
    kw: Optional[float] = Field(default=None, gt=0, le=S.HP_MAX * S.HP_TO_KW)
    rpm: float = Field(..., ge=S.RPM_MIN, le=S.RPM_MAX)
    power_factor: float = Field(default=S.DEFAULT_POWER_FACTOR, ge=S.PF_MIN, le=S.PF_MAX)

    @field_validator("kw")
    @classmethod
    def require_power_value(cls, v, info):
        use_hp = info.data.get("use_hp", True)
        hp = info.data.get("hp")
        if not use_hp and v is None:
            raise ValueError("kw is required when use_hp is false")
        if use_hp and hp is None:
            raise ValueError("hp is required when use_hp is true")
        return v


class CableSizingRequest(BaseModel):
    flc: float = Field(..., gt=0, le=S.CURRENT_MAX, description="Full load current, A")
    length: float = Field(..., gt=0, le=S.LENGTH_MAX, description="Cable run length, m")
    travel_length: float = Field(..., gt=0, le=S.LENGTH_MAX, description="Crane travel span, m")
    voltage: Optional[float] = Field(default=None, ge=S.VOLTAGE_MIN, le=S.VOLTAGE_MAX)


class StarDeltaRequest(BaseModel):
    hp: float = Field(..., gt=0, le=S.HP_MAX)
    timer_seconds: float = Field(default=5, ge=1, le=60)
    voltage: Optional[float] = Field(default=None, ge=S.VOLTAGE_MIN, le=S.VOLTAGE_MAX)
    power_factor: Optional[float] = Field(default=None, ge=S.PF_MIN, le=S.PF_MAX)
    efficiency: Optional[float] = Field(default=None, ge=S.EFFICIENCY_MIN, le=S.EFFICIENCY_MAX)


class BOMMotorSet(BaseModel):
    hoist_hp: float = Field(..., gt=0, le=S.HP_MAX)
    lt_hp: float = Field(..., gt=0, le=S.HP_MAX)
    ct_hp: float = Field(..., gt=0, le=S.HP_MAX)
    travel_length: float = Field(..., gt=0, le=S.LENGTH_MAX)
    voltage: Optional[float] = Field(default=None, ge=S.VOLTAGE_MIN, le=S.VOLTAGE_MAX)
    power_factor: Optional[float] = Field(default=None, ge=S.PF_MIN, le=S.PF_MAX)
    efficiency: Optional[float] = Field(default=None, ge=S.EFFICIENCY_MIN, le=S.EFFICIENCY_MAX)

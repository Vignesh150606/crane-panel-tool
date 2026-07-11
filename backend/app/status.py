"""
Objective engineering status indicators — deliberately NOT star ratings.

Every calculation response includes one of these blocks so the frontend can
show Safety Margin / Sizing Status / Compliance / Assumed-vs-Computed without
inventing its own scoring logic.
"""
from app.engineering import safety_margin_pct, sizing_status
from app.data import standards as S

STATUS_LABELS = {
    "undersized": "Undersized",
    "adequate": "Adequate margin",
    "optimal": "Optimal margin",
    "oversized": "Oversized (cost margin)",
}

STATUS_DESCRIPTIONS = {
    "undersized": "Selected rating is below the calculated requirement. Re-check inputs before use.",
    "adequate": "Selected rating meets the requirement with a modest margin — standard, code-compliant practice.",
    "optimal": "Selected rating sits in the recommended design margin band above the bare minimum.",
    "oversized": "Selected rating is well above what's required — safe, but check if a smaller/cheaper size still clears the margin band.",
}


def build_status(selected_rating: float, required_rating: float, standard_key: str, unit: str = "A"):
    margin = safety_margin_pct(selected_rating, required_rating)
    status = sizing_status(margin)
    return {
        "safety_margin_pct": round(margin, 1),
        "sizing_status": status,
        "sizing_status_label": STATUS_LABELS[status],
        "sizing_status_description": STATUS_DESCRIPTIONS[status],
        "compliance_status": "compliant" if status != "undersized" else "review_required",
        "standards_reference": S.STANDARDS[standard_key],
        "selected_rating": f"{selected_rating} {unit}",
        "required_rating": f"{required_rating:.2f} {unit}",
    }


def assumed_or_computed(field_name: str, value: float, was_provided: bool, unit: str = ""):
    return {
        "field": field_name,
        "value": value,
        "unit": unit,
        "source": "computed" if was_provided else "assumed",
        "note": (
            "Entered by you" if was_provided
            else f"Not provided — using standard assumption of {value}{unit}. Override it for a project-specific value."
        ),
    }

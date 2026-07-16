# Engineering Assumptions & Standards

Every constant and formula referenced here lives in
`backend/app/data/standards.py` and `backend/app/engineering.py` — this
document explains them, it doesn't duplicate the source of truth. If the two
ever disagree, the code is correct and this file is stale.

## Defaults (all overridable per request)

| Assumption | Value | Basis |
|---|---|---|
| Supply voltage | 415V | Standard 3-phase industrial supply in India |
| Power factor | 0.85 | Typical industrial squirrel-cage motor |
| Motor efficiency class | IE3 | BIS IS 12615 mandates IE3 as the minimum for 0.75–375kW motors in India since July 2023 |
| Star-delta threshold | >5 HP | IS 13947 practice — DOL above ~5HP causes excessive inrush/voltage dip |

## Motor efficiency — looked up, not flat

Efficiency is read from a per-kW table (IEC 60034-30-1:2014, Table 1,
4-pole/50Hz — sourced from ABB Technical Note 9AKK107319), because a 0.75kW
motor and a 90kW motor are not equally efficient at the same IE class. A
flat efficiency number (the tool falls back to 85% only if a caller
supplies neither `ie_class` nor a manual `efficiency`) would systematically
mis-size small motors.

**Known, flagged simplification**: EOT crane hoist/travel motors are
usually intermittent duty (S3/S4/S5 per IS 807), not the continuous S1 duty
this IEC table is defined for. This is a standard, defensible reference
point for *preliminary* sizing — for a final panel design, use the actual
efficiency from the selected motor's datasheet.

## Component sizing multipliers

| Component | Multiplier | Basis |
|---|---|---|
| Contactor | ≥2.0× FLC | IEC 60947-4-1 AC-3 sizing: standard duty uses 1.25×, heavy-duty frequent starting uses 1.5×, and 2.0× is the documented ceiling for "severe applications demanding rapid reverse plugging, inching, or jogging" — which describes EOT crane hoist/travel duty. A prior version of this tool used 3.0× with no cited basis; corrected down to the documented severe-duty ceiling (see `REDESIGN_NOTES.md` for when this was caught). |
| Cable | ≥1.25× FLC | Continuous industrial duty derating |
| Thermal overload | 1.05× FLC | Trips on sustained overcurrent, rides through normal starting current |
| DOL inrush | 6× FLC (typical) | Standard cage-motor starting current multiple |
| Stretch wire length | 1.5× travel span | Sag/slack allowance |
| Busbar vs. stretch wire | >15m span | Above this, rigid busbar preferred over stretch/trailing cable |
| Voltage drop limit | 5% | IS 732 practical limit for motor circuits |

## Standards referenced, by calculation

| Calculation | Standard |
|---|---|
| Motor power | IS 3177 / IS 807 — EOT crane motor duty rating |
| Full load current | IS 325 |
| Motor efficiency | IEC 60034-30-1:2014, BIS IS 12615 |
| Contactor | IS/IEC 60947-4-1, AC-3 |
| MPCB | IS/IEC 60947-2 |
| Overload relay | IS/IEC 60947-4-1 |
| Cable | IS 7098 / IS 3961 |
| Voltage drop | IS 732 |
| Star-delta | IS 13947 |
| Busbar | IEC 61439-6 |
| Duty classification | IS 807 / FEM 1.001 |
| Main incoming breaker | IS/IEC 60947-2 |

## Sizing margin bands

A selected component is classified by `margin_pct = (selected - required) /
required × 100`:
- **< 0%** → undersized. This is a real, reachable state — the
  cable/MPCB/contactor selectors fall back to the top of their ratings
  table when nothing satisfies the requirement (e.g. FLC above the largest
  MPCB rating), and the UI reflects that (component status colors follow
  the actual sizing status, not a hardcoded "looks fine" green).
- **0–15%** → adequate, tight margin.
- **15–60%** → optimal design margin.
- **> 60%** → oversized (cost/space inefficiency).

## Documented common mistakes

The Engineering Handbook and the tutor's system prompt both draw on the
same list (`standards.py::COMMON_MISTAKES`) — for example: applying motor
efficiency twice (once sizing HP from load, again computing FLC from that
HP — it only belongs in the FLC step); sizing a contactor at plain AC-1
current instead of AC-3 duty; computing voltage drop with the single-phase
formula on a 3-phase circuit (missing √3); sizing the main incoming breaker
as the sum of individual MPCB ratings instead of coincident total FLC. Full
list in `standards.py`.

## What this tool does not do

- It does not replace a licensed engineer's final sign-off. It's a
  preliminary sizing and learning tool.
- It does not account for ambient temperature derating, cable grouping
  factors, or altitude correction on component ratings — flagged here
  rather than silently assumed away.
- It uses continuous-duty (S1) efficiency figures for calculation, noting
  where intermittent crane duty (S3/S4) would differ — see above.

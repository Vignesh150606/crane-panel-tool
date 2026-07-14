/**
 * Display-only mirror of the standard 3-core copper armoured cable size /
 * current-capacity table (IS 7098) that the backend already uses to pick
 * ONE cable size in `backend/app/data/standards.py` (CABLE_SIZES /
 * CABLE_CAPACITY). Duplicated here purely so the frontend can render the
 * full comparison — "why this size and not a smaller one" — without a
 * second API round trip. The actual selected size, capacity, voltage drop
 * and sizing status always come from the live `/api/cable-busbar` response;
 * this table never drives a calculation, only the comparison chart.
 */
export const CABLE_SIZES = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240]

export const CABLE_CAPACITY = {
  1.5: 15, 2.5: 20, 4: 27, 6: 34, 10: 46,
  16: 61, 25: 80, 35: 99, 50: 119, 70: 151,
  95: 182, 120: 210, 150: 240, 185: 273, 240: 320,
}

/**
 * Build comparison rows around the selected size (a small window, not all
 * 15 standard sizes, so the chart stays readable) — a couple of sizes below
 * the selection (to show why they fail) and a couple above (to show the
 * next step up).
 */
export function cableComparisonWindow(selectedSize, requiredCapacity) {
  const idx = CABLE_SIZES.indexOf(selectedSize)
  const start = Math.max(0, idx - 2)
  const end = Math.min(CABLE_SIZES.length, idx + 3)
  return CABLE_SIZES.slice(start, end).map((size) => ({
    size,
    label: `${size}`,
    capacity: CABLE_CAPACITY[size],
    selected: size === selectedSize,
    adequate: CABLE_CAPACITY[size] >= requiredCapacity,
  }))
}

/**
 * Validate a single numeric field against engineering-plausible bounds.
 * Returns an error string, or null if valid. Mirrors the bounds enforced
 * server-side in backend/app/models.py so the user sees the same rule
 * instantly, before a round trip to the API.
 */
export function validateNumber(value, { label, min, max, required = true } = {}) {
  if (value === '' || value === null || value === undefined || Number.isNaN(value)) {
    return required ? `${label} is required.` : null
  }
  if (min !== undefined && value <= min) {
    return `${label} must be greater than ${min}.`
  }
  if (min === undefined && value < 0) {
    return `${label} cannot be negative.`
  }
  if (max !== undefined && value > max) {
    return `${label} must be ${max} or less.`
  }
  return null
}

/** Run a {field: {value, ...rules}} map through validateNumber, return {field: error}. */
export function validateFields(fieldMap) {
  const errors = {}
  for (const [key, cfg] of Object.entries(fieldMap)) {
    const err = validateNumber(cfg.value, cfg)
    if (err) errors[key] = err
  }
  return errors
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0
}

// Shared bound presets mirroring backend/app/data/standards.py
export const BOUNDS = {
  voltage: { min: 100, max: 1000 },
  powerFactor: { min: 0.5, max: 1.0 },
  efficiency: { min: 0.5, max: 1.0 },
  loadTons: { min: 0.1, max: 1000 },
  speed: { min: 0.5, max: 200 },
  hp: { min: 0.1, max: 1000 },
  current: { min: 0.1, max: 3000 },
  rpm: { min: 200, max: 6000 },
  length: { min: 0.5, max: 2000 },
}

const SIZES = {
  md: { input: 'px-3 py-2 text-sm', unit: 'right-3 text-xs', unitPad: 'pr-12', label: 'text-xs mb-1.5' },
  lg: { input: 'px-4 py-3.5 text-base', unit: 'right-4 text-sm', unitPad: 'pr-14', label: 'text-sm mb-2' },
}

export default function NumberField({
  label, value, onChange, min, max, step = 'any', unit, error, helper, disabled, size = 'md', ...props
}) {
  const hasError = !!error
  const s = SIZES[size] || SIZES.md
  return (
    <div className="mb-3.5">
      {label && (
        <label className={`block text-text-muted font-medium ${s.label}`}>{label}</label>
      )}
      <div className="relative">
        <input
          type="number"
          value={Number.isFinite(value) ? value : (value ?? '')}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(e) => {
            const raw = e.target.value
            onChange(raw === '' ? '' : parseFloat(raw))
          }}
          className={`w-full bg-inset border rounded-md text-text font-mono ${s.input}
            transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-amber/40 disabled:opacity-40
            ${hasError ? 'border-danger' : 'border-steel focus:border-amber'}
            ${unit ? s.unitPad : ''}`}
          {...props}
        />
        {unit && (
          <span className={`absolute top-1/2 -translate-y-1/2 text-text-dim font-mono pointer-events-none ${s.unit}`}>
            {unit}
          </span>
        )}
      </div>
      {hasError ? (
        <div className="text-xs text-danger mt-1">{error}</div>
      ) : helper ? (
        <div className="text-xs text-text-dim mt-1">{helper}</div>
      ) : null}
    </div>
  )
}

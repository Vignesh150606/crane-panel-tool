export default function NumberField({
  label, value, onChange, min, max, step = 'any', unit, error, helper, disabled, ...props
}) {
  const hasError = !!error
  return (
    <div className="mb-3.5">
      {label && (
        <label className="block text-xs text-text-muted mb-1.5 font-medium">{label}</label>
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
          className={`w-full bg-inset border rounded-md px-3 py-2 text-sm text-text font-mono
            transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-amber/40 disabled:opacity-40
            ${hasError ? 'border-danger' : 'border-steel focus:border-amber'}
            ${unit ? 'pr-12' : ''}`}
          {...props}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-dim font-mono pointer-events-none">
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

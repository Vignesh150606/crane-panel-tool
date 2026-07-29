import { useId } from 'react'

const SIZES = {
  md: { input: 'px-3 py-2 text-sm', unit: 'right-3 text-xs', unitPad: 'pr-12', label: 'text-xs mb-1.5' },
  lg: { input: 'px-4 py-3.5 text-base', unit: 'right-4 text-sm', unitPad: 'pr-14', label: 'text-sm mb-2' },
}

export default function NumberField({
  label, value, onChange, min, max, step = 'any', unit, error, helper, disabled, id: customId, size = 'md', ...props
}) {
  const generatedId = useId()
  const inputId = customId || generatedId
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`
  const hasError = !!error
  const s = SIZES[size] || SIZES.md

  return (
    <div className="mb-3.5">
      {label && (
        <label htmlFor={inputId} className={`block text-text-muted font-medium ${s.label}`}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type="number"
          value={Number.isFinite(value) ? value : (value ?? '')}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : helper ? helperId : undefined}
          onChange={(e) => {
            const raw = e.target.value
            onChange(raw === '' ? '' : parseFloat(raw))
          }}
          className={`w-full bg-inset border rounded-md text-text font-mono ${s.input}
            transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-amber/40 disabled:opacity-40 disabled:cursor-not-allowed
            ${hasError ? 'border-danger focus:border-danger' : 'border-steel focus:border-amber'}
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
        <div id={errorId} className="text-xs text-danger font-medium mt-1.5">{error}</div>
      ) : helper ? (
        <div id={helperId} className="text-xs text-text-dim mt-1">{helper}</div>
      ) : null}
    </div>
  )
}


import { useId } from 'react'

export default function TextField({ label, value, onChange, placeholder, helper, error, disabled, id: customId, ...props }) {
  const generatedId = useId()
  const inputId = customId || generatedId
  const helperId = `${inputId}-helper`
  const errorId = `${inputId}-error`
  const hasError = !!error

  return (
    <div className="mb-3.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs text-text-muted mb-1.5 font-medium">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type="text"
        value={value ?? ''}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : helper ? helperId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-inset border rounded-md px-3 py-2 text-sm text-text
          transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-amber/40 disabled:opacity-40 disabled:cursor-not-allowed
          ${hasError ? 'border-danger focus:border-danger' : 'border-steel focus:border-amber'}`}
        {...props}
      />
      {hasError ? (
        <div id={errorId} className="text-xs text-danger font-medium mt-1.5">{error}</div>
      ) : helper ? (
        <div id={helperId} className="text-xs text-text-dim mt-1">{helper}</div>
      ) : null}
    </div>
  )
}


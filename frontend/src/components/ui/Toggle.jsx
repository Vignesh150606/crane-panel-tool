export default function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none py-1 group">
      <span
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(!checked) } }}
        className={`mt-0.5 relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-150
          ${checked ? 'bg-amber border-amber' : 'bg-inset border-steel group-hover:border-steel-light'}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-ink transition-transform duration-150
            ${checked ? 'translate-x-4' : 'translate-x-1'}`}
        />
      </span>
      <span>
        <span className="text-sm text-text block">{label}</span>
        {description && <span className="text-xs text-text-dim block mt-0.5">{description}</span>}
      </span>
    </label>
  )
}

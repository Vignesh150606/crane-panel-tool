export default function SelectField({ label, value, onChange, options, helper, ...props }) {
  return (
    <div className="mb-3.5">
      {label && <label className="block text-xs text-text-muted mb-1.5 font-medium">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-inset border border-steel rounded-md px-3 py-2 text-sm text-text
          transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber cursor-pointer"
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {helper && <div className="text-xs text-text-dim mt-1">{helper}</div>}
    </div>
  )
}

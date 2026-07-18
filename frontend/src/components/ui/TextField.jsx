export default function TextField({ label, value, onChange, placeholder, ...props }) {
  return (
    <div className="mb-3.5">
      {label && <label className="block text-xs text-text-muted mb-1.5 font-medium">{label}</label>}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-inset border border-steel rounded-md px-3 py-2 text-sm text-text
          transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber"
        {...props}
      />
    </div>
  )
}

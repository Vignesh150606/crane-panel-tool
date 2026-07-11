const TONES = {
  neutral: 'text-text',
  amber: 'text-amber',
  safe: 'text-safe',
  danger: 'text-danger',
  info: 'text-info',
  copper: 'text-copper',
}

export default function StatPlate({ label, value, unit, note, tone = 'neutral', size = 'md' }) {
  return (
    <div className="bg-inset rounded-lg px-3 py-2.5 border border-steel">
      <div className="text-[0.65rem] uppercase tracking-[0.08em] text-text-dim font-medium mb-1">{label}</div>
      <div className={`font-mono font-semibold ${TONES[tone]} ${size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-base'} leading-tight`}>
        {value}{unit && <span className="text-text-dim font-normal text-[0.75em] ml-1">{unit}</span>}
      </div>
      {note && <div className="text-[0.7rem] text-text-dim mt-0.5">{note}</div>}
    </div>
  )
}

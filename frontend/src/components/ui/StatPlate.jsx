const TONES = {
  neutral: 'text-text',
  amber: 'text-amber',
  safe: 'text-safe',
  danger: 'text-danger',
  info: 'text-info',
  copper: 'text-copper font-semibold',
}

export default function StatPlate({ label, value, unit, note, tone = 'neutral', size = 'md' }) {
  return (
    <div className="bg-inset rounded-lg px-3.5 py-2.5 border border-steel">
      <div className="text-xs uppercase tracking-[0.08em] text-text-dim font-medium mb-1.5 truncate">{label}</div>
      <div className={`font-mono font-bold ${TONES[tone] || TONES.neutral} ${size === 'lg' ? 'text-xl sm:text-2xl' : size === 'sm' ? 'text-sm' : 'text-base sm:text-lg'} leading-tight`}>
        {value}{unit && <span className="text-text-dim font-normal text-[0.8em] ml-1">{unit}</span>}
      </div>
      {note && <div className="text-xs text-text-dim mt-1 leading-snug">{note}</div>}
    </div>
  )
}


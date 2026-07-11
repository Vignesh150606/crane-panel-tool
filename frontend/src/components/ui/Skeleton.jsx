export default function Skeleton({ className = '', rows }) {
  if (rows) {
    return (
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`animate-pulse bg-steel/50 rounded ${className || 'h-4 w-full'}`} />
        ))}
      </div>
    )
  }
  return <div className={`animate-pulse bg-steel/50 rounded ${className}`} />
}

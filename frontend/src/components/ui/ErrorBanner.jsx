import { AlertOctagon, RotateCw } from 'lucide-react'
import Button from './Button'

export default function ErrorBanner({ message, onRetry, retrying }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-3 bg-danger-dim border border-danger/40 rounded-lg px-4 py-3">
      <AlertOctagon size={18} className="text-danger shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-text">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RotateCw} onClick={onRetry} disabled={retrying}>
          {retrying ? 'Retrying…' : 'Retry'}
        </Button>
      )}
    </div>
  )
}

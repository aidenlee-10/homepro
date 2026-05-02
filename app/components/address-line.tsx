import { MapPin } from 'lucide-react'

type AddressLineProps = {
  children: React.ReactNode
  className?: string
}

export function AddressLine({ children, className = '' }: AddressLineProps) {
  return (
    <div className={`flex min-w-0 items-start gap-1.5 text-xs font-medium text-slate-400 ${className}`}>
      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2} aria-hidden />
      <span className="min-w-0 truncate">{children}</span>
    </div>
  )
}

import type { ComponentType } from 'react'
import { Droplets, Home, Sun, Wind, Wrench, type LucideProps } from 'lucide-react'

const SERVICE_ICONS: Record<string, ComponentType<LucideProps>> = {
  'Window Cleaning': Wind,
  'Gutter Cleaning': Home,
  'Pressure Washing': Droplets,
  'Solar Panel Cleaning': Sun,
}

type ServiceTypeIconProps = {
  serviceType: string
  className?: string
}

/** Maps known service names to Lucide icons; defaults to Wrench for custom/other types. */
export function ServiceTypeIcon({ serviceType, className = 'h-5 w-5' }: ServiceTypeIconProps) {
  const Icon = SERVICE_ICONS[serviceType] ?? Wrench
  return <Icon className={className} strokeWidth={1.75} aria-hidden />
}

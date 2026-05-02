'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

type SidebarLayoutProps = {
  title?: string
  subtitle?: string
  children: ReactNode
  headerActions?: ReactNode
  isWorker?: boolean
  /** Omit the standard page title row (e.g. dashboard uses a custom hero). */
  showPageHeader?: boolean
}

type NavItem = {
  href: string
  label: string
  icon: 'dashboard' | 'calendar' | 'customers' | 'history' | 'workers' | 'services'
  ownerOnly?: boolean
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar' },
  { href: '/customers', label: 'Customers', icon: 'customers', ownerOnly: true },
  { href: '/history', label: 'History', icon: 'history', ownerOnly: true },
  { href: '/workers', label: 'Workers', icon: 'workers', ownerOnly: true },
  { href: '/services', label: 'Services', icon: 'services', ownerOnly: true },
]

function NavIcon({ name, className = 'h-5 w-5' }: { name: NavItem['icon']; className?: string }) {
  const base = className
  switch (name) {
    case 'dashboard':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M4 4h7v7H4V4Zm9 0h7v4h-7V4ZM4 13h7v7H4v-7Zm9-3h7v10h-7V10Z" fill="currentColor" />
        </svg>
      )
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M7 2h2v3H7V2Zm8 0h2v3h-2V2ZM4 6h16v14H4V6Zm2 4v8h12v-8H6Z" fill="currentColor" />
        </svg>
      )
    case 'customers':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path
            d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0H5Zm13-10a3 3 0 1 0 0-6h-1a5 5 0 0 1 0 6h1Zm1 10a5 5 0 0 0-3-4.58A6.96 6.96 0 0 1 19 20Z"
            fill="currentColor"
          />
        </svg>
      )
    case 'history':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M12 4a8 8 0 1 1-7.75 10h2.08A6 6 0 1 0 12 6V2L7.5 6.5 12 11V7a5 5 0 1 1-4.58 3H9.6A3 3 0 1 0 12 9v3h3v2h-5V4Z" fill="currentColor" />
        </svg>
      )
    case 'workers':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="M12 3 2 7l10 4 8-3.2V13h2V7L12 3Zm-6 9v5l6 3 6-3v-5l-6 2.4L6 12Z" fill="currentColor" />
        </svg>
      )
    case 'services':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={base} aria-hidden="true">
          <path d="m14.8 2 1.3 2.6 2.9.4-2.1 2 0.5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4L14.8 2ZM3 14h8v8H3v-8Zm10 2h8v2h-8v-2Zm0 4h8v2h-8v-2Z" fill="currentColor" />
        </svg>
      )
    default:
      return null
  }
}

function SignOutIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 4H4v16h6v2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h6v2Zm8.5 5 5 5-5 5-1.4-1.4 2.6-2.6H9v-2h10.7l-2.6-2.6L18.5 9Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function SidebarLayout({
  title,
  subtitle,
  children,
  headerActions,
  isWorker = false,
  showPageHeader = true,
}: SidebarLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = navItems.filter(item => !(isWorker && item.ownerOnly))

  const desktopNav = (
    <nav className="mt-8 flex-1 space-y-1">
      {links.map(item => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
              active
                ? 'bg-white/[0.08] text-white shadow-[inset_3px_0_0_0_#2563eb]'
                : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <span
              className={`transition-colors duration-200 ${active ? 'text-[#2563eb]' : 'text-slate-400 group-hover:text-slate-200'}`}
            >
              <NavIcon name={item.icon} />
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  const mobileTab = (item: NavItem) => {
    const active = pathname === item.href
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors duration-200 ${
          active ? 'text-[#2563eb]' : 'text-slate-400 hover:text-slate-200'
        }`}
        aria-label={item.label}
      >
        <NavIcon name={item.icon} className="h-6 w-6" />
        <span className="sr-only">{item.label}</span>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-[260px] md:fixed md:inset-y-0 md:left-0 z-30 flex-col bg-[#0f172a] text-slate-100 border-r border-slate-800/80">
        <div className="flex h-full flex-col px-5 pt-8 pb-6">
          <Link href="/" className="text-xl font-semibold tracking-tight text-white transition-opacity duration-200 hover:opacity-90">
            HomePro
          </Link>
          {desktopNav}
          <button
            type="button"
            onClick={signOut}
            className="hp-btn-secondary mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/[0.08]"
          >
            <SignOutIcon className="h-4 w-4 shrink-0 opacity-80" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="md:pl-[260px] pb-20 md:pb-0">
        <main className="min-h-screen px-4 py-6 md:px-10 md:py-10">
          <div className="max-w-6xl mx-auto">
            {showPageHeader && title ? (
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
                  {subtitle ? <p className="text-sm font-medium text-slate-400 mt-1.5">{subtitle}</p> : null}
                </div>
                {headerActions ? <div className="shrink-0 flex flex-wrap gap-2">{headerActions}</div> : null}
              </div>
            ) : headerActions ? (
              <div className="mb-6 flex justify-end">{headerActions}</div>
            ) : null}
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar — icons only */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex h-16 items-stretch justify-around border-t border-slate-800/90 bg-[#0f172a] px-1 safe-area-pb"
        aria-label="Primary"
      >
        {links.map(item => mobileTab(item))}
        <button
          type="button"
          onClick={signOut}
          className="hp-btn-secondary flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-slate-400 transition-colors duration-200 hover:text-[#dc2626]"
          aria-label="Sign out"
        >
          <SignOutIcon className="h-6 w-6" />
          <span className="sr-only">Sign out</span>
        </button>
      </nav>
    </div>
  )
}

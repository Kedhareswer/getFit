import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ClipboardList,
  Dumbbell,
  Home,
  Settings as SettingsIcon,
  Star,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

const NAV: NavItem[] = [
  { label: 'Home', to: '/', icon: Home, end: true },
  { label: 'Exercises', to: '/exercises', icon: Dumbbell },
  { label: 'Workouts', to: '/workouts', icon: ClipboardList },
  { label: 'Favorites', to: '/favorites', icon: Star },
  { label: 'Progress', to: '/progress', icon: TrendingUp },
  { label: 'Settings', to: '/settings', icon: SettingsIcon },
]

export default function Layout() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  // a11y: on route change, scroll to top and move focus to main content.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    mainRef.current?.focus()
  }, [location.pathname])

  return (
    <div className="min-h-screen lg:flex">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface/60 px-3 py-5 backdrop-blur lg:flex">
        <Brand />
        <nav aria-label="Primary" className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => (
            <SideLink key={item.to} item={item} />
          ))}
        </nav>
        <div className="mt-auto px-3 pt-6 text-xs text-dim">
          <p className="leading-relaxed">
            Private by design — all data stays in your browser.
          </p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/80 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-border bg-surface/90 backdrop-blur lg:hidden"
      >
        {NAV.map((item) => (
          <BottomLink key={item.to} item={item} />
        ))}
      </nav>
    </div>
  )
}

function Brand() {
  return (
    <NavLink to="/" className="flex items-center gap-2.5 px-2" aria-label="GetFit home">
      <img src="/logo.svg" alt="" width={32} height={32} className="rounded-lg" />
      <span className="font-display text-xl font-bold tracking-tight">
        Get<span className="text-primary">Fit</span>
      </span>
    </NavLink>
  )
}

function SideLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
          isActive
            ? 'bg-primary/15 text-primary'
            : 'text-muted hover:bg-surface-2 hover:text-text',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={19} aria-hidden />
          <span>{item.label}</span>
          {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
        </>
      )}
    </NavLink>
  )
}

function BottomLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        [
          'flex flex-col items-center gap-0.5 py-2 text-[0.625rem] font-medium transition',
          isActive ? 'text-primary' : 'text-muted',
        ].join(' ')
      }
    >
      <Icon size={20} aria-hidden />
      <span>{item.label}</span>
    </NavLink>
  )
}

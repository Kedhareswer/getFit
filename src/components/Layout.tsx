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
        className="sr-only z-50 rounded-lg bg-text px-4 py-2 font-semibold text-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-bg/70 px-4 py-6 backdrop-blur-xl lg:flex">
        <Brand />
        <nav aria-label="Primary" className="mt-10 flex flex-col gap-0.5">
          {NAV.map((item) => (
            <SideLink key={item.to} item={item} />
          ))}
        </nav>
        <div className="mt-auto border-t border-border pt-5">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-dim leading-relaxed">
            Private by design
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Everything stays in your browser. Nothing leaves this device.
          </p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/80 px-5 py-3.5 backdrop-blur-xl lg:hidden">
        <Brand />
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-border bg-bg/90 backdrop-blur-xl lg:hidden"
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
    <NavLink to="/" className="flex items-center gap-2.5" aria-label="GetFit home">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-text font-display text-lg leading-none text-bg">
        G
      </span>
      <span className="font-display text-xl tracking-tight">GetFit</span>
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
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition duration-200 ease-quint',
          isActive ? 'bg-surface-2 text-text' : 'text-muted hover:bg-surface-2/60 hover:text-text',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            aria-hidden
            className={isActive ? 'text-primary' : 'text-dim group-hover:text-muted'}
          />
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
          'flex flex-col items-center gap-1 py-2.5 text-[0.625rem] font-medium transition',
          isActive ? 'text-text' : 'text-dim',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={20} aria-hidden className={isActive ? 'text-primary' : ''} />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

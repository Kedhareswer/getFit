import { useRef, useState } from 'react'
import {
  Languages,
  Sparkles,
  Scale,
  Moon,
  Sun,
  Download,
  Upload,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import type { Settings as SettingsType, SessionLog } from '../types'
import { useStore, sanitizeWorkouts } from '../state/store'
import { LANGS, LANG_NAMES } from '../lib/data'
import ConfirmDialog from '../components/ui/ConfirmDialog'

// security: bound imported arrays so a hostile/oversized file can't blow up memory.
const IMPORT_LIMITS = { workouts: 200, history: 500, favorites: 5000 }

type ImportStatus = { type: 'success' | 'error'; message: string } | null

export default function Settings() {
  const settings = useStore((s) => s.settings)
  const patchSettings = useStore((s) => s.patchSettings)

  const fileRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<ImportStatus>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const exportData = () => {
    const { workouts, history, favorites, settings: current } = useStore.getState()
    const data = { workouts, history, favorites, settings: current }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'getfit-data.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = async (file: File) => {
    setImportStatus(null)
    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('File is not a valid GetFit backup.')
      }
      const obj = parsed as Record<string, unknown>

      // sanitize/clamp imported workouts so corrupt numeric fields can't OOM a later session
      const workouts = sanitizeWorkouts(obj.workouts).slice(0, IMPORT_LIMITS.workouts)
      const history = Array.isArray(obj.history)
        ? (obj.history as SessionLog[]).slice(0, IMPORT_LIMITS.history)
        : []
      const favorites = Array.isArray(obj.favorites)
        ? (obj.favorites as unknown[])
            .filter((x): x is string => typeof x === 'string')
            .slice(0, IMPORT_LIMITS.favorites)
        : []
      const importedSettings =
        obj.settings && typeof obj.settings === 'object'
          ? (obj.settings as Partial<SettingsType>)
          : {}

      useStore.setState((s) => ({
        workouts,
        history,
        favorites,
        // merge over current so unknown/missing keys keep valid defaults
        settings: { ...s.settings, ...importedSettings },
      }))

      setImportStatus({
        type: 'success',
        message: `Imported ${workouts.length} workout${workouts.length === 1 ? '' : 's'} and ${history.length} session${history.length === 1 ? '' : 's'}.`,
      })
    } catch {
      setImportStatus({
        type: 'error',
        message: "Could not read that file. Make sure it's a GetFit backup (.json).",
      })
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleImportFile(file)
    // allow re-selecting the same file
    e.target.value = ''
  }

  const resetAll = () => {
    useStore.setState({ workouts: [], history: [], favorites: [], activeSession: null })
    setConfirmReset(false)
    setImportStatus(null)
  }

  return (
    <div className="page max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted">Personalise GetFit and manage your data.</p>
      </header>

      <div className="flex flex-col gap-4">
        {/* 1) Instruction language */}
        <section className="card animate-fade-in">
          <div className="mb-3 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Languages size={18} aria-hidden />
            </span>
            <div>
              <h2 className="section-title">Instruction language</h2>
              <p className="mt-0.5 text-sm text-muted">
                Language used for exercise instructions and steps.
              </p>
            </div>
          </div>
          <label className="label" htmlFor="setting-lang">
            Language
          </label>
          <select
            id="setting-lang"
            className="input"
            value={settings.lang}
            onChange={(e) => patchSettings({ lang: e.target.value as SettingsType['lang'] })}
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_NAMES[l]}
              </option>
            ))}
          </select>
        </section>

        {/* 2) Reduce motion */}
        <section className="card animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles size={18} aria-hidden />
              </span>
              <div>
                <h2 className="section-title">Reduce motion</h2>
                <p className="mt-0.5 max-w-md text-sm text-muted">
                  Show a click-to-play poster instead of auto-playing exercise animations.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.reduceMotion}
              aria-label="Reduce motion"
              onClick={() => patchSettings({ reduceMotion: !settings.reduceMotion })}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                settings.reduceMotion ? 'bg-primary' : 'bg-surface-2 border border-border-strong'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-elev-1 transition-transform ${
                  settings.reduceMotion ? 'translate-x-6' : 'translate-x-1'
                }`}
                aria-hidden
              />
            </button>
          </div>
        </section>

        {/* 3) Units */}
        <section className="card animate-fade-in">
          <div className="mb-3 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Scale size={18} aria-hidden />
            </span>
            <div>
              <h2 className="section-title">Units</h2>
              <p className="mt-0.5 text-sm text-muted">Weight unit used for logging and totals.</p>
            </div>
          </div>
          <div role="group" aria-label="Weight units" className="flex gap-2">
            {(['kg', 'lb'] as const).map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={settings.units === u}
                onClick={() => patchSettings({ units: u })}
                className={`chip ${settings.units === u ? 'chip-active' : ''}`}
              >
                {u === 'kg' ? 'Kilograms (kg)' : 'Pounds (lb)'}
              </button>
            ))}
          </div>
        </section>

        {/* 4) Theme */}
        <section className="card animate-fade-in">
          <div className="mb-3 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              {settings.theme === 'dark' ? (
                <Moon size={18} aria-hidden />
              ) : (
                <Sun size={18} aria-hidden />
              )}
            </span>
            <div>
              <h2 className="section-title">Theme</h2>
              <p className="mt-0.5 text-sm text-muted">Choose a dark or light appearance.</p>
            </div>
          </div>
          <div role="group" aria-label="Theme" className="flex gap-2">
            {(['dark', 'light'] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={settings.theme === t}
                onClick={() => patchSettings({ theme: t })}
                className={`chip ${settings.theme === t ? 'chip-active' : ''}`}
              >
                {t === 'dark' ? (
                  <Moon size={14} aria-hidden />
                ) : (
                  <Sun size={14} aria-hidden />
                )}
                {t === 'dark' ? 'Dark' : 'Light'}
              </button>
            ))}
          </div>
        </section>

        {/* 5) Data management */}
        <section className="card animate-fade-in">
          <h2 className="section-title">Data management</h2>
          <p className="mt-0.5 text-sm text-muted">
            Back up your workouts, history and favorites, or start fresh.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn btn-secondary" onClick={exportData}>
                <Download size={16} aria-hidden />
                Export data
              </button>

              <button
                type="button"
                className="btn btn-soft"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={16} aria-hidden />
                Import data
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                aria-label="Import data file"
                onChange={onFileChange}
              />
            </div>

            {importStatus && (
              <p
                role="status"
                aria-live="polite"
                className={`flex items-start gap-2 text-sm ${
                  importStatus.type === 'success' ? 'text-success' : 'text-danger'
                }`}
              >
                {importStatus.type === 'success' ? (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden />
                ) : (
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
                )}
                <span>{importStatus.message}</span>
              </p>
            )}

            <div className="mt-1 border-t border-border pt-4">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setConfirmReset(true)}
              >
                <Trash2 size={16} aria-hidden />
                Reset all data
              </button>
              <p className="mt-2 text-sm text-dim">
                Permanently removes all workouts, session history and favorites from this browser.
              </p>
            </div>
          </div>
        </section>

        {/* 6) Privacy note */}
        <section className="card animate-fade-in">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
              <Lock size={18} aria-hidden />
            </span>
            <div>
              <h2 className="section-title">Privacy</h2>
              <p className="mt-0.5 text-sm text-muted">
                Private by design — all your data stays in this browser's local storage. Nothing is
                uploaded.
              </p>
            </div>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset all data?"
        message="This permanently deletes all workouts, session history and favorites stored in this browser. This cannot be undone."
        confirmLabel="Reset everything"
        cancelLabel="Cancel"
        danger
        onConfirm={resetAll}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  )
}

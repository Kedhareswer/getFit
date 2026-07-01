import { useState } from 'react'
import { Play } from 'lucide-react'
import { mediaUrl } from '../lib/data'
import { useStore } from '../state/store'

interface Props {
  mediaId: string | null
  name: string
  /** body-part hex — tints the designed fallback so the catalog looks intentional */
  accent?: string
  /** load immediately (above-the-fold hero) vs lazy (grid cards) */
  eager?: boolean
  /** classes for the aspect-ratio wrapper (caller controls size/aspect) */
  className?: string
}

/**
 * Exercise media tile. A designed, network-free backdrop (accent-tinted panel + serif
 * monogram) is ALWAYS painted, so a missing or blocked animation still looks like a
 * deliberate catalog cover — never a broken image. The hotlinked GIF (if the media host
 * is reachable) fades in on top. Security: src is built from a validated media_id, sent
 * no-referrer, inert under script-src 'self'. Reduced-motion users get click-to-play.
 */
export default function ExerciseGif({ mediaId, name, accent = '#B7A99A', eager = false, className = '' }: Props) {
  const reduceMotion = useStore((s) => s.settings.reduceMotion)
  const url = mediaUrl(mediaId)
  const [play, setPlay] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  const wantImg = !!url && !failed && (!reduceMotion || play)
  const initial = (name.trim()[0] || '•').toUpperCase()

  return (
    <div
      className={`relative overflow-hidden bg-surface-2 ${className}`}
      style={{ containerType: 'inline-size' }}
    >
      {/* Designed backdrop — always present */}
      <div
        className="absolute inset-0 grid place-items-center"
        style={{ background: `radial-gradient(115% 115% at 50% 4%, ${accent}2e, transparent 68%)` }}
        aria-hidden
      >
        <span
          className="select-none font-display font-normal leading-none"
          style={{ fontSize: '34cqi', color: accent, opacity: 0.4 }}
        >
          {initial}
        </span>
      </div>

      {/* Hotlinked GIF, layered on top; fades in only once it actually decodes */}
      {wantImg && (
        <img
          src={url!}
          alt={`${name} — animated demonstration`}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            e.currentTarget.onerror = null
            setFailed(true)
          }}
          className={`absolute inset-0 h-full w-full bg-surface-2 object-contain transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Reduced-motion poster: explicit play (GIF not fetched until requested) */}
      {!!url && !failed && reduceMotion && !play && (
        <button
          type="button"
          onClick={() => setPlay(true)}
          className="group absolute inset-0 grid place-items-center"
          aria-label={`Play animation for ${name}`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg/75 text-text backdrop-blur transition group-hover:scale-105">
            <Play size={18} aria-hidden />
          </span>
        </button>
      )}
    </div>
  )
}

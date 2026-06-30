import { useState } from 'react'
import { Dumbbell, Play } from 'lucide-react'
import { mediaUrl } from '../lib/data'
import { useStore } from '../state/store'

interface Props {
  mediaId: string | null
  name: string
  /** load immediately (above-the-fold hero) vs lazy (grid cards) */
  eager?: boolean
  /** classes for the aspect-ratio wrapper (caller controls size/aspect) */
  className?: string
}

/**
 * Hotlinked exercise animation. Security: src is built from a validated media_id,
 * sent with referrerPolicy="no-referrer", and can never execute script (img is inert
 * under script-src 'self'). Reduced-motion users get a click-to-play poster so no GIF
 * animates (and isn't even fetched) until requested. Broken media falls back locally.
 */
export default function ExerciseGif({ mediaId, name, eager = false, className = '' }: Props) {
  const reduceMotion = useStore((s) => s.settings.reduceMotion)
  const url = mediaUrl(mediaId)
  const [play, setPlay] = useState(false)
  const [failed, setFailed] = useState(false)

  const showImg = !!url && !failed && (!reduceMotion || play)

  return (
    <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
      {showImg ? (
        <img
          src={url}
          alt={`${name} — animated demonstration`}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain"
          onError={(e) => {
            e.currentTarget.onerror = null
            setFailed(true)
          }}
        />
      ) : failed || !url ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-dim">
          <Dumbbell size={32} aria-hidden />
          <span className="text-xs font-medium">Animation unavailable</span>
        </div>
      ) : (
        // reduced-motion poster: explicit play, GIF not fetched until clicked
        <button
          type="button"
          onClick={() => setPlay(true)}
          className="group absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted transition hover:text-text"
          aria-label={`Play animation for ${name}`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary transition group-hover:bg-primary/25">
            <Play size={22} aria-hidden />
          </span>
          <span className="text-xs font-semibold">Play animation</span>
        </button>
      )}
    </div>
  )
}

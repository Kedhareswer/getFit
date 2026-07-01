import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useStore } from '../state/store'

gsap.registerPlugin(ScrollTrigger)
// House easing ≈ cubic-bezier(.22,1,.36,1): everything settles, nothing bounces.
export const EASE = 'expo.out'
gsap.defaults({ ease: EASE, duration: 0.7 })

/** True when motion should be suppressed (Settings toggle OR OS preference). */
export function useReduceMotion(): boolean {
  const setting = useStore((s) => s.settings.reduceMotion)
  const [os, setOs] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setOs(mq.matches)
    const on = () => setOs(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return setting || os
}

/**
 * Scroll-reveal for a page section. Put the returned ref on a container, then add
 * `data-reveal` to the children you want to rise + fade in (staggered). Runs once,
 * respects reduced-motion, and cleans up on unmount. Initial hide happens in a
 * layout effect (before paint) so there's no flash and no "hidden forever" if JS fails.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null)
  const reduce = useReduceMotion()

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const targets = gsap.utils.toArray<HTMLElement>(root.querySelectorAll('[data-reveal]'))
    if (targets.length === 0) return

    if (reduce) {
      gsap.set(targets, { clearProps: 'opacity,transform' })
      return
    }

    const ctx = gsap.context(() => {
      gsap.set(targets, { opacity: 0, y: 22 })
      ScrollTrigger.batch(targets, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, stagger: 0.09, overwrite: true }),
      })
    }, root)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, ...deps])

  return ref
}

/**
 * Editorial hero: each word rises out of a mask, staggered. Pass text with `\n`
 * for line breaks. Falls back to plain text under reduced-motion.
 */
export function Words({
  text,
  className = '',
  as: Tag = 'h1',
  delay = 0,
  stagger = 0.06,
}: {
  text: string
  className?: string
  as?: keyof JSX.IntrinsicElements
  delay?: number
  stagger?: number
}) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReduceMotion()
  const lines = useMemo(() => text.split('\n').map((l) => l.split(' ')), [text])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || reduce) return
    const inners = el.querySelectorAll('.word-inner')
    const ctx = gsap.context(() => {
      gsap.set(inners, { yPercent: 115 })
      gsap.to(inners, { yPercent: 0, duration: 0.9, ease: EASE, stagger, delay })
    }, el)
    return () => ctx.revert()
  }, [reduce, text, delay, stagger])

  return (
    // @ts-expect-error dynamic tag
    <Tag ref={ref} className={className}>
      {lines.map((words, li) => (
        <span className="words-line" key={li}>
          {words.map((w, wi) => (
            <span className="word-mask" key={wi}>
              <span className="word-inner">
                {w}
                {wi < words.length - 1 ? ' ' : ''}
              </span>
            </span>
          ))}
        </span>
      ))}
    </Tag>
  )
}

/** Count a number up when it scrolls into view. Reduced-motion shows the final value. */
export function CountUp({
  value,
  decimals = 0,
  className = '',
  duration = 1.2,
}: {
  value: number
  decimals?: number
  className?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReduceMotion()
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduce || value === 0) {
      el.textContent = fmt(value)
      return
    }
    const obj = { n: 0 }
    el.textContent = fmt(0)
    const ctx = gsap.context(() => {
      const tween = gsap.to(obj, {
        n: value,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = fmt(obj.n)
        },
      })
      tween.pause()
      ScrollTrigger.create({
        trigger: el,
        start: 'top 92%',
        once: true,
        onEnter: () => tween.play(),
      })
    }, el)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce, decimals, duration])

  return <span ref={ref} className={className}>{fmt(reduce ? value : 0)}</span>
}

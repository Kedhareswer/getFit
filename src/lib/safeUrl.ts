// Allowlist URL schemes for any non-constant href. Rejects javascript:/data:/blob:.
// Returns a safe href or '#'. Relative/same-origin paths pass through.
export function safeUrl(value: string | null | undefined): string {
  if (!value) return '#'
  const v = value.trim()
  // relative or root-relative in-app paths are fine
  if (v.startsWith('/') || v.startsWith('#') || v.startsWith('./') || v.startsWith('../')) return v
  try {
    const u = new URL(v, window.location.origin)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '#'
  } catch {
    return '#'
  }
}

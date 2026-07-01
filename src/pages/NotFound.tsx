import { Link } from 'react-router-dom'
import { Words } from '../lib/anim'

export default function NotFound() {
  return (
    <div className="page">
      <h1 className="sr-only">Page not found</h1>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="overline">Error 404</p>
        <Words
          as="p"
          text="404"
          className="mt-4 font-display text-display-lg leading-[0.95] text-text"
        />
        <p className="mt-6 font-display text-2xl leading-snug text-text">Page not found</p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Link to="/" className="btn btn-primary">
            Back to home
          </Link>
          <Link to="/exercises" className="btn btn-ghost">
            Browse exercises
          </Link>
        </div>
      </div>
    </div>
  )
}

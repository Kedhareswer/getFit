import { Compass } from 'lucide-react'
import EmptyState from '../components/EmptyState'

export default function NotFound() {
  return (
    <div className="page">
      <h1 className="sr-only">Page not found</h1>
      <EmptyState
        icon={Compass}
        title="Page not found"
        message="The page you're looking for doesn't exist or may have moved."
        action={{ label: 'Back to home', to: '/' }}
        secondary={{ label: 'Browse exercises', to: '/exercises' }}
      />
    </div>
  )
}

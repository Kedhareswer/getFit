import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="card max-w-md p-8 text-center">
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted">
              {this.state.error.message || 'An unexpected error occurred.'}
            </p>
            <button className="btn btn-primary mt-6" onClick={() => window.location.assign('/')}>
              Reload GetFit
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg m-4">
          <div className="h-12 w-12 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-[var(--color-error)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Something went wrong</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred in this component.'}
          </p>
          <Button onClick={() => this.setState({ hasError: false, error: null })}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

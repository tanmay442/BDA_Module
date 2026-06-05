import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50/70 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
            <p className="text-4xl">⚠️</p>
            <h1 className="mt-2 text-xl font-bold text-gray-800">Something went wrong</h1>
            <p className="mt-2 text-sm text-gray-600 break-words">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={this.reset}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

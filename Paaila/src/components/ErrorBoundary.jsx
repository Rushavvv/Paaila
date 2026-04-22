import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Something went wrong.',
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI crash caught by ErrorBoundary:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f8fafc' }}>
          <div style={{ maxWidth: 640, width: '100%', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, background: '#ffffff' }}>
            <h1 style={{ margin: 0, marginBottom: 8, fontSize: 24, color: '#0f172a' }}>Application Error</h1>
            <p style={{ margin: 0, marginBottom: 12, color: '#334155' }}>
              A screen failed to render. Please refresh and try again.
            </p>
            <p style={{ margin: 0, marginBottom: 16, color: '#64748b', fontSize: 14 }}>
              Details: {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              style={{ border: 'none', borderRadius: 8, padding: '10px 14px', background: '#2563eb', color: '#fff', cursor: 'pointer' }}
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

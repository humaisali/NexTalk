import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }

  static getDerivedStateFromError(error) { return { hasError: true, error }; }

  componentDidCatch(error, info) { console.error('ErrorBoundary caught:', error, info); }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-nt-bg flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-xl font-bold text-nt-text">Something went wrong</h1>
        <p className="text-nt-muted text-sm max-w-xs">
          NexTalk hit an unexpected error. Refreshing the page usually fixes it.
        </p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-2">
          Reload App
        </button>
        {process.env.NODE_ENV !== 'production' && (
          <pre className="text-xs text-nt-danger/70 mt-4 max-w-lg text-left overflow-auto">
            {this.state.error?.message}
          </pre>
        )}
      </div>
    );
  }
}

export default ErrorBoundary;

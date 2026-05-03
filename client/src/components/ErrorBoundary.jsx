import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary:', error, info); }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center"
           style={{ background: '#011F1B' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
             style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
          <AlertTriangle size={30} style={{ color: '#F87171' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#FFEFB2' }}>Something went wrong</h1>
          <p className="text-sm mt-2 max-w-xs" style={{ color: '#7A9E99' }}>
            NexTalk hit an unexpected error. Refreshing usually fixes it.
          </p>
        </div>
        <button onClick={() => window.location.reload()}
          className="btn-primary flex items-center gap-2">
          <RefreshCw size={15} />Reload App
        </button>
        {import.meta?.env?.DEV && (
          <pre className="text-xs max-w-lg text-left overflow-auto p-3 rounded-nt border mt-2"
               style={{ color: '#F87171', background: 'rgba(248,113,113,0.05)', borderColor: 'rgba(248,113,113,0.2)' }}>
            {this.state.error?.message}
          </pre>
        )}
      </div>
    );
  }
}

export default ErrorBoundary;

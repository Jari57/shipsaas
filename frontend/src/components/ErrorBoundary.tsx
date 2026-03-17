import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ShipSaaS crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-[2rem] p-10 space-y-6 text-center" style={{ boxShadow: '6px 6px 0 #0A0A0A' }}>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 text-3xl">!</div>
            <h1 className="text-3xl font-serif italic tracking-tighter">Something went wrong</h1>
            <p className="text-sm opacity-50 leading-relaxed">
              ShipSaaS encountered an unexpected error. This has been logged automatically.
            </p>
            <pre className="bg-[#F5F5F4] rounded-xl p-4 text-[11px] font-mono text-left overflow-auto max-h-32 opacity-60">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-[#0A0A0A] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-transform"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

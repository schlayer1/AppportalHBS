import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary gefangen:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-900 text-white select-none">
          <div className="max-w-md w-full p-8 rounded-3xl bg-slate-800/90 border border-slate-700/80 shadow-2xl backdrop-blur-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-black mb-2 text-white">
              {this.props.fallbackTitle || 'Ein Anzeigefehler ist aufgetreten'}
            </h2>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Dieses Modul konnte nicht geladen werden. Keine Sorge, deine Schuldaten und Tafelbilder sind sicher gespeichert.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-left font-mono text-xs text-rose-300 max-h-32 overflow-y-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-hbs-teal-deep text-white font-black text-xs hover:bg-hbs-teal-light transition-all active:scale-95 shadow-lg shadow-hbs-teal-deep/20 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Erneut versuchen</span>
              </button>

              <button
                onClick={() => {
                  window.location.href = window.location.origin + window.location.pathname;
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition-all active:scale-95 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Zum Portal</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

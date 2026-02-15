import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('App crash:', error, info); }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--c-bg)' }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#FF4757]/15 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-[#FF4757]" />
          </div>
          <h1 className="text-lg font-bold text-c-text mb-2">오류가 발생했습니다</h1>
          <p className="text-sm text-c-text2 mb-6">{this.state.error?.message || '알 수 없는 오류'}</p>
          <button onClick={() => location.reload()} className="btn-primary flex items-center justify-center gap-2 mx-auto"><RefreshCw size={16} /> 새로고침</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

export default ErrorBoundary;

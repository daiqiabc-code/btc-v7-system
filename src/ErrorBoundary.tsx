import { Component, ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('V7 ErrorBoundary caught:', error, info);
    // Render error in DOM for visibility
    const root = document.getElementById('root');
    if (root) {
      const pre = document.createElement('pre');
      pre.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#fff;color:#dc2626;padding:20px;font-size:14px;overflow:auto;z-index:99999;white-space:pre-wrap;';
      pre.textContent = `V7 ErrorBoundary caught:\n\n${error.message}\n\n${error.stack || ''}\n\nComponent stack: ${info?.componentStack || ''}`;
      root.innerHTML = '';
      root.appendChild(pre);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ position: 'fixed', inset: 0, background: '#fff', color: '#dc2626', padding: 20, fontSize: 14, overflow: 'auto', zIndex: 99999, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
          <h2>❌ V7 ErrorBoundary</h2>
          <p><strong>{this.state.error.message}</strong></p>
          <pre>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

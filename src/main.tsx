import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ErrorBoundary } from './ErrorBoundary'

// Top-level error handlers
window.addEventListener('error', (e) => {
  console.error('[GLOBAL] Uncaught error:', e.error || e.message);
  const root = document.getElementById('root');
  if (root && !root.querySelector('[data-error]')) {
    const pre = document.createElement('pre');
    pre.setAttribute('data-error', 'true');
    pre.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#fff;color:#dc2626;padding:20px;font-size:14px;overflow:auto;z-index:99999;white-space:pre-wrap;';
    pre.textContent = `[GLOBAL ERROR]\n${e.message || e}\n\n${e.error?.stack || ''}\n\n${e.filename || ''}:${e.lineno || ''}`;
    root.appendChild(pre);
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[GLOBAL] Unhandled rejection:', e.reason);
  const root = document.getElementById('root');
  if (root && !root.querySelector('[data-rejection]')) {
    const pre = document.createElement('pre');
    pre.setAttribute('data-rejection', 'true');
    pre.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#fff;color:#dc2626;padding:20px;font-size:14px;overflow:auto;z-index:99999;white-space:pre-wrap;';
    pre.textContent = `[UNHANDLED REJECTION]\n${String(e.reason)}\n\n${e.reason?.stack || ''}`;
    root.appendChild(pre);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

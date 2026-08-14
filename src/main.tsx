import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent annoying benign Vite websocket connection rejections or closed-connection overlays in the sandbox
if (typeof window !== 'undefined') {
  const isViteOrWS = (err: any) => {
    if (!err) return false;
    // Check if the event or error target is a WebSocket instance
    try {
      if (err.target && (err.target instanceof WebSocket || err.target.constructor?.name === 'WebSocket')) {
        return true;
      }
    } catch (e) {}

    const str = String(err.stack || err.message || err.reason || err || '').toLowerCase();
    return str.includes('websocket') || 
           str.includes('without opened') || 
           str.includes('vite') || 
           str.includes('hmr') ||
           str.includes('closed without');
  };

  // Prevent console.warn and console.error output from triggering notifications or logs
  const originalWarn = window.console.warn;
  window.console.warn = function (...args) {
    if (args.some(arg => isViteOrWS(arg))) return;
    originalWarn.apply(window.console, args);
  };

  const originalError = window.console.error;
  window.console.error = function (...args) {
    if (args.some(arg => isViteOrWS(arg))) return;
    originalError.apply(window.console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isViteOrWS(event.reason) || isViteOrWS(event)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (isViteOrWS(event.error) || isViteOrWS(event.message) || isViteOrWS(event)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


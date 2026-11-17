import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { initCloudflareWebAnalytics } from './services/cloudflareAnalytics';
import { SW_UPDATE_EVENT } from './components/common/SwUpdateBanner';
import './index.css';

// Initialisiere Cloudflare Web Analytics (falls Token vorhanden)
initCloudflareWebAnalytics();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// Register Service Worker for Offline PWA support in production with controlled updates
if ('serviceWorker' in navigator && !window.location.hostname.includes('localhost')) {
  let isRefreshing = false;

  const notifyUpdateReady = (worker: ServiceWorker | null) => {
    if (!worker) return;
    window.dispatchEvent(new CustomEvent(SW_UPDATE_EVENT, { detail: { worker } }));
  };

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (isRefreshing) return;
    isRefreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        if (registration.waiting) {
          notifyUpdateReady(registration.waiting);
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              notifyUpdateReady(newWorker);
            }
          });
        });

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        });
      })
      .catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
  });
}

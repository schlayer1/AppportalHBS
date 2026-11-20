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

declare const __HBS_BUILD_ID__: string;

const CURRENT_CACHE_NAME =
  typeof __HBS_BUILD_ID__ !== 'undefined' ? `hbs-app-portal-${__HBS_BUILD_ID__}` : 'hbs-app-portal-v1';

function queryWorkerCacheName(worker: ServiceWorker, timeoutMs = 400): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, timeoutMs);

    try {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          resolve(typeof event.data?.cacheName === 'string' ? event.data.cacheName : null);
        }
      };
      worker.postMessage({ type: 'GET_CACHE_NAME' }, [channel.port2]);
    } catch {
      if (!settled) {
        settled = true;
        window.clearTimeout(timer);
        resolve(null);
      }
    }
  });
}

// Register Service Worker for Offline PWA support in production with controlled updates
if ('serviceWorker' in navigator && !window.location.hostname.includes('localhost')) {
  let isRefreshing = false;

  const evaluateWaitingWorker = async (worker: ServiceWorker | null) => {
    if (!worker) return;
    const workerCacheName = await queryWorkerCacheName(worker);

    // If the waiting worker is from an older legacy build (no reply) or matches the build
    // already running in this tab, activate it silently in the background without any banner or reload.
    if (
      !workerCacheName ||
      workerCacheName === 'hbs-app-portal-v1' ||
      workerCacheName === CURRENT_CACHE_NAME
    ) {
      worker.postMessage({ type: 'SKIP_WAITING' });
      return;
    }

    // Genuine new deployment detected while an older build is still open in the tab
    window.dispatchEvent(
      new CustomEvent(SW_UPDATE_EVENT, { detail: { worker, cacheName: workerCacheName } })
    );
  };

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (isRefreshing) return;
    if (!(window as any).__hbsUserRequestedSwReload) return;
    isRefreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        if (registration.waiting) {
          void evaluateWaitingWorker(registration.waiting);
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              void evaluateWaitingWorker(newWorker);
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

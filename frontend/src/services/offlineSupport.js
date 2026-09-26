export function registerOfflineSupport() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;

  window.addEventListener('load', () => {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch(() => {
        // Offline support is progressive enhancement; the site remains usable online.
      });
  }, { once: true });
}

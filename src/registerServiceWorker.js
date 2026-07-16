if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('SAMS service worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.error('Service worker registration failed:', err);
      });
  });
}

// This caches static code only; user data stays in the encrypted vault.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(error => {
      console.warn('Não foi possível preparar o modo offline.', error);
    });
  });
}

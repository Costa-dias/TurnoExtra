import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import type { Plugin } from 'vite';

// Only static files from the build are cached. User data stays in the encrypted vault.
export function workerSource(cacheName: string, assets: string[]) {
  return `const CACHE = ${JSON.stringify(cacheName)};
const ASSETS = ${JSON.stringify(assets)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key =>
    key !== CACHE && (key.startsWith('turnoextra-static-') ||
      (key.startsWith('workbox-precache-v2-') && key.endsWith(self.registration.scope)))
  ).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match('/index.html')) || Response.error();
    }));
  } else if (ASSETS.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(async cache =>
      (await cache.match(url.pathname)) || fetch(request)));
  }
});
`;
}

export function staticPwa(): Plugin {
  let output = '';
  return {
    name: 'turnoextra-static-pwa',
    apply: 'build',
    configResolved(config) { output = resolve(config.root, config.build.outDir); },
    async closeBundle() {
      const paths: string[] = [];
      async function walk(dir: string) {
        for (const entry of await readdir(dir, { withFileTypes: true })) {
          const path = resolve(dir, entry.name);
          if (entry.isDirectory()) await walk(path);
          else if (/\.(js|css|html|svg|png|ico|webmanifest)$/.test(entry.name) && entry.name !== 'sw.js' && entry.name !== 'registerSW.js' && !entry.name.startsWith('workbox-')) paths.push(path);
        }
      }
      await walk(output);
      paths.sort();
      const hash = createHash('sha256');
      for (const path of paths) { hash.update(relative(output, path)); hash.update(await readFile(path)); }
      const assets = paths.map(path => '/' + relative(output, path).replaceAll('\\', '/'));
      await writeFile(resolve(output, 'sw.js'), workerSource('turnoextra-static-' + hash.digest('hex').slice(0, 16), assets));
    },
  };
}

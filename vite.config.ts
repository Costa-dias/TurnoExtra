import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';
import { randomBytes } from 'node:crypto';

const PROD_CSP =
  "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; manifest-src 'self'; form-action 'self'; upgrade-insecure-requests";

const securityHeaders = {
  'Content-Security-Policy': PROD_CSP,
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
};

// Dev-only nonce: allows Vite's inline React Refresh preamble without
// weakening production CSP. Generated once per dev-server session.
const DEV_NONCE = randomBytes(16).toString('base64');
const DEV_CSP =
  `default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; ` +
  `script-src 'self' 'nonce-${DEV_NONCE}'; ` +
  `style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; ` +
  `connect-src 'self' ws: wss: http://localhost:* http://127.0.0.1:*; ` +
  `worker-src 'self' blob:; manifest-src 'self'; form-action 'self'; upgrade-insecure-requests`;

const devSecurityHeaders = {
  ...securityHeaders,
  'Content-Security-Policy': DEV_CSP,
};

function devCspPlugin(): Plugin {
  return {
    name: 'dev-csp-nonce',
    apply: 'serve',
    transformIndexHtml(html) {
      return html.replace(
        /<meta http-equiv="Content-Security-Policy" content="[^"]*"/,
        `<meta http-equiv="Content-Security-Policy" content="${DEV_CSP}"`
      );
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    devCspPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'TurnoExtra — Gestão de Plantões',
        short_name: 'TurnoExtra',
        description:
          'Gestão e visualização de escalas de plantão para profissionais de saúde.',
        theme_color: '#0f766e',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  html: {
    cspNonce: command === 'serve' ? DEV_NONCE : undefined,
  },
  server: {
    headers: devSecurityHeaders,
  },
  preview: {
    headers: securityHeaders,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
}));

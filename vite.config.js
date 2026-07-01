import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Strict production CSP (matches public/_headers & vercel.json).
// frame-ancestors/X-Frame-Options are delivered as real HTTP headers (ignored in <meta>).
var PROD_CSP = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://cdn.jsdelivr.net",
    "connect-src 'self'",
    "frame-src 'none'",
    "form-action 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    'upgrade-insecure-requests',
].join('; ');
// Inject the CSP meta only for production builds. Dev keeps it off so Vite's
// inline HMR preamble + websocket work. ponytail: CSP is a prod concern; verify via `vite preview`.
function cspMeta() {
    return {
        name: 'getfit-csp-meta',
        apply: 'build',
        transformIndexHtml: function (html) {
            var tag = "<meta http-equiv=\"Content-Security-Policy\" content=\"".concat(PROD_CSP, "\">");
            return html.replace('<head>', "<head>\n    ".concat(tag));
        },
    };
}
export default defineConfig({
    plugins: [react(), cspMeta()],
    build: { target: 'es2020', sourcemap: false },
    server: { port: 5173 },
    preview: { port: 4173 },
});

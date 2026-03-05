import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import puppeteer from 'puppeteer-core'

/**
 * Custom Vite plugin: IDX API Proxy (using Puppeteer + real browser)
 * 
 * Launches a headless Edge browser that navigates to IDX first (to pass
 * Cloudflare challenge), then makes API calls from within the browser context.
 * This bypasses TLS fingerprinting since it IS a real browser.
 *
 * No cookies/tokens needed — the browser handles Cloudflare automatically!
 */

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

// Cache the browser page so we don't re-launch for every request
let browserPage = null;
let browserInstance = null;
let initPromise = null;

async function getPage() {
  if (browserPage) return browserPage;

  // Prevent multiple simultaneous launches
  if (initPromise) return initPromise;

  initPromise = (async () => {
    console.log('[IDX Proxy] Launching headless Edge browser...');
    browserInstance = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const page = await browserInstance.newPage();

    // Set a realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0'
    );

    // Navigate to IDX first to solve Cloudflare challenge
    console.log('[IDX Proxy] Navigating to IDX to pass Cloudflare...');
    await page.goto('https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    console.log('[IDX Proxy] ✓ Browser ready, Cloudflare passed!');

    browserPage = page;
    return page;
  })();

  return initPromise;
}

function idxProxyPlugin() {
  return {
    name: 'idx-proxy',
    configureServer(server) {
      server.middlewares.use('/api/idx', async (req, res) => {
        const targetPath = req.url || '';
        const targetUrl = `https://www.idx.co.id${targetPath}`;

        try {
          console.log(`[IDX Proxy] Fetching: ${targetUrl}`);
          const page = await getPage();

          // Use the browser's fetch from within the page context
          // This inherits all cookies and Cloudflare clearance
          const result = await page.evaluate(async (url) => {
            try {
              const resp = await fetch(url, {
                headers: { 'Accept': 'application/json' },
              });
              const text = await resp.text();
              return { status: resp.status, body: text, ok: resp.ok };
            } catch (e) {
              return { status: 500, body: JSON.stringify({ error: e.message }), ok: false };
            }
          }, targetUrl);

          if (result.ok && result.body.trim().startsWith('{')) {
            console.log(`[IDX Proxy] ✓ Got JSON (${result.body.length} bytes)`);
          } else {
            console.log(`[IDX Proxy] ✗ Status ${result.status}, body: ${result.body.substring(0, 100)}`);
          }

          res.writeHead(result.status, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(result.body);
        } catch (err) {
          console.error('[IDX Proxy Error]', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // Clean up browser on server close
      server.httpServer?.on('close', async () => {
        if (browserInstance) {
          await browserInstance.close();
          browserInstance = null;
          browserPage = null;
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), idxProxyPlugin()],
})

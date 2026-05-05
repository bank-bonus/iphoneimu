import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import path from 'path';
import cors from 'cors';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // Proxy endpoint to bypass X-Frame-Options and CSP
  app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url as string;
    const userAgent = req.query.ua as string || 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
    
    if (!targetUrl) {
      return res.status(400).send('URL query parameter is required');
    }

    try {
      const response = await axios.get(targetUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        responseType: 'text',
        timeout: 10000,
      });

      let html = response.data;
      
      // Ensure targetUrl ends with a slash if it's just a domain for proper base tag behavior
      const normalizedBase = targetUrl.includes('?') ? targetUrl.split('?')[0] : targetUrl;
      const baseTag = `<base href="${normalizedBase}">`;
      
      // Inject base tag and mobile viewport if missing
      const mobileViewport = '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">';
      
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${baseTag}${mobileViewport}`);
      } else {
        html = `<html><head>${baseTag}${mobileViewport}</head><body>${html}</body></html>`;
      }

      // Aggressively remove frame-blocking scripts and meta tags
      html = html.replace(/<meta http-equiv="Content-Security-Policy".*?>/gi, '');
      html = html.replace(/<meta http-equiv="X-Frame-Options".*?>/gi, '');
      html = html.replace(/if\s*\(window\.top\s*!==\s*window\.self\).*?{.*?}/g, ''); 
      html = html.replace(/if\s*\(top\s*!==\s*self\).*?{.*?}/g, '');
      html = html.replace(/window\.top\s*=\s*window\.self/g, '');
      html = html.replace(/parent\.location\s*=\s*self\.location/g, '');

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('X-Frame-Options', 'ALLOWALL');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(html);
    } catch (error: any) {
      console.error('Proxy error:', error.message);
      res.status(500).send(`
        <div style="font-family: sans-serif; padding: 40px; text-align: center; background: #111; color: #fff; height: 100vh;">
          <h2 style="color: #ef4444;">Proxy Error</h2>
          <p>Could not load: <b>${targetUrl}</b></p>
          <p style="opacity: 0.6; font-size: 14px;">The site might be blocking proxy requests or the URL is invalid.</p>
          <button onclick="window.location.reload()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; margin-top: 20px;">Try Again</button>
        </div>
      `);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

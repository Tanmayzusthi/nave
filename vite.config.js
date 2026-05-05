/* global process */

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  if (env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY) {
    process.env.OPENROUTER_API_KEY = env.OPENROUTER_API_KEY
  }

  if (env.OPENROUTER_SITE_URL && !process.env.OPENROUTER_SITE_URL) {
    process.env.OPENROUTER_SITE_URL = env.OPENROUTER_SITE_URL
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'local-api',
        configureServer(server) {
          server.middlewares.use('/api', async (req, res, next) => {
            if (req.method !== 'POST') return next();
            try {
              const route = req.url.split('?')[0].slice(1);
              let handler;
              if (route === 'chat') {
                handler = (await import('./api/chat.js')).default;
              } else if (route === 'tts') {
                handler = (await import('./api/tts.js')).default;
              } else {
                return next();
              }
              await handler(req, res);
            } catch (error) {
              console.error(error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: error.message }));
            }
          });
        },
      },
    ],
  }
})

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
        name: 'local-api-chat',
        configureServer(server) {
          server.middlewares.use('/api/chat', async (req, res, next) => {
            if (req.method !== 'POST') {
              next()
              return
            }

            try {
              const { default: handler } = await import('./api/chat.js')
              await handler(req, res)
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: error.message || 'Nave OS chat failed.' }))
            }
          })
        },
      },
    ],
  }
})

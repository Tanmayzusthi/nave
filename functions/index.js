const { onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');

admin.initializeApp();

const NVIDIA_API_KEY = defineSecret('NVIDIA_API_KEY');
const NVIDIA_MODEL = 'abacusai/dracarys-llama-3.1-70b-instruct';
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://naveos-3341c.web.app',
  'https://naveos-3341c.firebaseapp.com'
];

const setCorsHeaders = (req, res) => {
  const origin = req.get('origin');

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }

  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');
};

const sendError = (res, status, message) => {
  res.status(status).json({ error: { message } });
};

const SYSTEM_PROMPT = `
You are Nave OS, a premium, ultra-modern AI Operating System.
Your aesthetic is minimal, elegant, and intelligent.
When asked who you are, always identify as Nave OS.
Maintain a professional yet approachable persona.
`;

const buildMemoryContext = (memories = []) => {
  if (!Array.isArray(memories) || memories.length === 0) return '';

  const memoryLines = memories
    .slice(0, 5)
    .map((memory, index) => {
      const title = String(memory.title || 'Memory').slice(0, 120);
      const content = String(memory.content || '').slice(0, 700);
      return `${index + 1}. ${title}: ${content}`;
    })
    .join('\n');

  return `
Relevant permanent user memories:
${memoryLines}

Use these memories only when they are directly relevant to the user's request. Do not mention that you are using memory unless the user asks.
`;
};

const normalizeMessages = (messages = []) => {
  if (!Array.isArray(messages)) {
    throw new HttpsError('invalid-argument', 'messages must be an array.');
  }

  return messages
    .filter((message) => message && typeof message.content === 'string')
    .slice(-20)
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content.slice(0, 8000)
    }));
};

const buildMessages = (messages, memories) => {
  const normalized = normalizeMessages(messages);
  const firstUserIndex = normalized.findIndex((message) => message.role === 'user');
  const conversation = firstUserIndex === -1 ? [] : normalized.slice(firstUserIndex);
  const memoryContext = buildMemoryContext(memories);

  if (conversation.length === 0) {
    throw new HttpsError('invalid-argument', 'At least one user message is required.');
  }

  return [
    {
      role: 'system',
      content: `${SYSTEM_PROMPT}${memoryContext ? `\n${memoryContext}` : ''}`
    },
    ...conversation
  ];
};

exports.nvidiaChat = onRequest(
  {
    secrets: [NVIDIA_API_KEY],
    timeoutSeconds: 60,
    memory: '512MiB'
  },
  async (req, res) => {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      sendError(res, 405, 'Method not allowed.');
      return;
    }

    const authHeader = req.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!idToken) {
      sendError(res, 401, 'You must be signed in to use NVIDIA fallback.');
      return;
    }

    try {
      await admin.auth().verifyIdToken(idToken);
    } catch (authError) {
      logger.warn('Invalid NVIDIA proxy auth token', authError);
      sendError(res, 401, 'Invalid authentication token.');
      return;
    }

    const apiKey = NVIDIA_API_KEY.value();

    if (!apiKey) {
      sendError(res, 500, 'NVIDIA API key is not configured.');
      return;
    }

    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: NVIDIA_MODEL,
          messages: buildMessages(req.body?.messages, req.body?.memories),
          temperature: 0.2,
          top_p: 0.7,
          max_tokens: 1024,
          stream: false
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        logger.error('NVIDIA API error', {
          status: response.status,
          message: data.error?.message
        });
        sendError(res, 502, data.error?.message || `NVIDIA API request failed with status ${response.status}.`);
        return;
      }

      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        sendError(res, 502, 'NVIDIA returned an empty response.');
        return;
      }

      res.status(200).json({ text });
    } catch (error) {
      if (error instanceof HttpsError) {
        sendError(res, 400, error.message);
        return;
      }

      logger.error('NVIDIA proxy failure', error);
      sendError(res, 500, 'NVIDIA fallback failed.');
    }
  }
);

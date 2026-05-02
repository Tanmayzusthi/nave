/* global Buffer, process */

const NVIDIA_MODEL = 'abacusai/dracarys-llama-3.1-70b-instruct';

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
    throw new Error('messages must be an array.');
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
    throw new Error('At least one user message is required.');
  }

  return [
    {
      role: 'system',
      content: `${SYSTEM_PROMPT}${memoryContext ? `\n${memoryContext}` : ''}`
    },
    ...conversation
  ];
};

const readBody = async (req) => {
  if (req.body) return req.body;

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
};

const sendJson = (res, status, payload) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).end(JSON.stringify(payload));
};

const readJsonResponse = async (response) => {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text } };
  }
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed.' });
      return;
    }

    const apiKey = process.env.NVIDIA_API_KEY;

    if (!apiKey) {
      sendJson(res, 500, { error: 'NVIDIA API key is not configured.' });
      return;
    }

    const body = await readBody(req);
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: buildMessages(body.messages, body.memories),
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 1024,
        stream: false
      })
    });

    const data = await readJsonResponse(response);

    if (!response.ok || data.error) {
      const message = data.error?.message || `NVIDIA API request failed with status ${response.status}.`;
      sendJson(res, response.ok ? 502 : response.status, { error: message });
      return;
    }

    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      sendJson(res, 502, { error: 'NVIDIA returned an empty response.' });
      return;
    }

    sendJson(res, 200, { reply: text });
  } catch (error) {
    console.error('Vercel NVIDIA proxy failure:', error);
    sendJson(res, 500, { error: error.message || 'NVIDIA fallback failed.' });
  }
}

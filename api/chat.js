/* global Buffer, process */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'openrouter/auto';

const SYSTEM_PROMPT = `
You are Nave OS, a premium, ultra-modern AI Operating System.
Your aesthetic is minimal, elegant, and intelligent.
When asked who you are, always identify as Nave OS.
Maintain a professional yet approachable persona.

You have an autonomous memory system. If the user tells you a personal fact, preference, rule, or long-term context that you should remember for future conversations, you MUST save it.
To save a memory, you must output a block formatted EXACTLY like this anywhere in your response:
<SAVE_MEMORY title="Short Title">The exact detailed memory to save.</SAVE_MEMORY>

You can save multiple memories by outputting multiple blocks. 
IMPORTANT: Only output the <SAVE_MEMORY> block when the user shares something new worth remembering.
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
  if (typeof res.status === 'function') {
    res.status(status).end(JSON.stringify(payload));
    return;
  }

  res.statusCode = status;
  res.end(JSON.stringify(payload));
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

const readAssistantReply = (data) => {
  const content = data.choices?.[0]?.message?.content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        return part?.text || '';
      })
      .join('')
      .trim();
  }

  return typeof content === 'string' ? content.trim() : '';
};

const createChatPayload = (messages) => ({
  model: OPENROUTER_MODEL,
  messages,
  temperature: 0.2,
  top_p: 0.7,
  max_tokens: 1024,
  stream: false
});

const callOpenRouter = async ({ apiKey, messages }) => {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://naveos-3341c.web.app',
      'X-Title': 'Nave OS'
    },
    body: JSON.stringify(createChatPayload(messages))
  });

  const data = await readJsonResponse(response);

  if (!response.ok || data.error) {
    console.error('OpenRouter Error Response:', JSON.stringify(data, null, 2));
    if (data.error?.message === 'User not found.') {
      throw new Error(`OpenRouter rejected your API key. We sent: "${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 4)}" (Length: ${apiKey.length}). This key is strictly invalid or deleted on OpenRouter.ai. You must create a new one.`);
    }
    throw new Error(data.error?.message || `OpenRouter request failed with status ${response.status}.`);
  }

  const reply = readAssistantReply(data);

  if (!reply) {
    console.error('Full OpenRouter Response:', JSON.stringify(data, null, 2));
    throw new Error('OpenRouter returned an empty response. Check console logs.');
  }

  return reply;
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed.' });
      return;
    }

    const rawKey = process.env.OPENROUTER_API_KEY;
    const apiKey = rawKey ? rawKey.trim() : '';

    if (!apiKey) {
      sendJson(res, 500, { error: 'OpenRouter API key is entirely missing or empty.' });
      return;
    }

    if (apiKey.includes('your_openrouter_key_here')) {
      sendJson(res, 500, { error: 'You are still using the placeholder API key from .env.example. Please paste the real key.' });
      return;
    }

    if (!apiKey.startsWith('sk-or-')) {
      sendJson(res, 500, { error: `Invalid key format! Your key starts with "${apiKey.substring(0, 4)}". OpenRouter keys MUST start with "sk-or-". Did you accidentally paste a Gemini or NVIDIA key?` });
      return;
    }

    const body = await readBody(req);
    const messages = buildMessages(body.messages, body.memories);
    const reply = await callOpenRouter({ apiKey, messages });
    sendJson(res, 200, { reply });
  } catch (error) {
    console.error('Vercel chat proxy failure:', error);
    const status =
      error.message === 'messages must be an array.' ||
      error.message === 'At least one user message is required.'
        ? 400
        : 500;

    sendJson(res, status, { error: error.message || 'Nave OS chat failed.' });
  }
}

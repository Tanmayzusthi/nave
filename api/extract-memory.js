export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Content-Type', 'application/json');
      res.status(405).end(JSON.stringify({ error: 'Method not allowed.' }));
      return;
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).end(JSON.stringify({ error: 'OpenRouter API key is not configured.' }));
      return;
    }

    let body = req.body;
    if (!body && req.read) {
       // manual read if needed, but vercel parses json
    }

    const { message } = typeof body === 'string' ? JSON.parse(body) : body;

    if (!message) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400).end(JSON.stringify({ error: 'Message is required.' }));
      return;
    }

    const systemPrompt = `
You are a memory extraction system. Your task is to analyze the user's message and extract any personal facts, durable preferences, recurring goals, names, or habits that are worth remembering long-term.
Ignore temporary or random noise (e.g., "what's the weather", "hello", "write me a poem").
If no memory-worthy information is present, output an empty JSON array: []
If there is memory-worthy information, output a JSON array of objects with the following schema:
[
  {
    "title": "Short descriptive title",
    "content": "Detailed content of the memory",
    "importance": 8 // score from 1 to 10
  }
]
Reply ONLY with the valid JSON array and nothing else. No markdown formatting like \`\`\`json.
`;

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://naveos-3341c.web.app',
        'X-Title': 'Nave OS Memory Extraction'
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" } // might not be supported by all models, so we prompt strongly
      })
    });

    const data = await openRouterResponse.json();

    if (!openRouterResponse.ok || data.error) {
      throw new Error(data.error?.message || 'Failed to extract memory from OpenRouter.');
    }

    let textContent = data.choices?.[0]?.message?.content || '[]';
    textContent = textContent.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let memories = [];
    try {
      memories = JSON.parse(textContent);
      if (!Array.isArray(memories)) {
        if (memories.memories) memories = memories.memories;
        else memories = [];
      }
    } catch (e) {
      console.error('Failed to parse memory JSON:', textContent);
      memories = [];
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify({ memories }));
  } catch (error) {
    console.error('Memory extraction error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).end(JSON.stringify({ error: error.message || 'Memory extraction failed.' }));
  }
}

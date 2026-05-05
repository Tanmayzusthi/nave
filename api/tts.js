export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Content-Type', 'application/json');
      res.status(405).end(JSON.stringify({ error: 'Method not allowed.' }));
      return;
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).end(JSON.stringify({ error: 'ElevenLabs API key is not configured.' }));
      return;
    }

    let body = req.body;
    if (!body && req.read) {
       const chunks = [];
       for await (const chunk of req) chunks.push(chunk);
       body = Buffer.concat(chunks).toString('utf8');
       body = body ? JSON.parse(body) : {};
    } else if (typeof body === 'string') {
       body = JSON.parse(body);
    }

    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = body;

    if (!text) {
      res.setHeader('Content-Type', 'application/json');
      res.status(400).end(JSON.stringify({ error: 'Text is required.' }));
      return;
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.5 }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs error: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).end(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('TTS error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).end(JSON.stringify({ error: error.message || 'TTS generation failed.' }));
  }
}

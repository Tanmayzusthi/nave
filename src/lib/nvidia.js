export async function getNvidiaResponse(messages, memories = []) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages, memories })
  });

  const rawBody = await response.text();
  const data = rawBody ? JSON.parse(rawBody) : { error: 'Nave OS returned an empty response. Please try again.' };

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Nave OS could not reach the AI service. Please try again.');
  }

  const text = data.reply;

  if (!text) {
    throw new Error('Nave OS returned an empty response. Please try again.');
  }

  return text;
}

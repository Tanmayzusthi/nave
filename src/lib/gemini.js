const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const SYSTEM_PROMPT = `
You are Nave OS, a premium, ultra-modern AI Operating System. 
Your aesthetic is minimal, elegant, and intelligent.
When asked who you are, always identify as Nave OS.
Maintain a professional yet approachable persona.
`;

const buildMemoryContext = (memories = []) => {
  if (memories.length === 0) return '';

  const memoryLines = memories
    .slice(0, 5)
    .map((memory, index) => `${index + 1}. ${memory.title}: ${memory.content}`)
    .join('\n');

  return `
Relevant permanent user memories:
${memoryLines}

Use these memories only when they are directly relevant to the user's request. Do not mention that you are using memory unless the user asks.
`;
};

export async function getGeminiResponse(messages, memories = []) {
  try {
    const memoryContext = buildMemoryContext(memories);
    const promptContext = `${SYSTEM_PROMPT}${memoryContext ? `\n${memoryContext}` : ''}`;

    // Merge the system prompt into the very first user message for 100% compatibility
    const contents = messages.map((msg, index) => {
      let text = msg.content;
      
      // If it's the first user message, prefix it with the system prompt
      if (index === 1 && msg.role === 'user') {
        text = `${promptContext}\n\nUser Message: ${msg.content}`;
      } else if (index === 0 && msg.role === 'user') {
        // Just in case the first message is a user message
        text = `${promptContext}\n\nUser Message: ${msg.content}`;
      }

      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text }]
      };
    }).filter(msg => msg.role === 'user' || msg.role === 'model');

    // Ensure we don't start with a 'model' role (Gemini requirement)
    const firstUserIndex = contents.findIndex(c => c.role === 'user');
    const finalContents = firstUserIndex !== -1 ? contents.slice(firstUserIndex) : contents;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: finalContents
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response candidates returned. Please try a different prompt.");
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Nave OS Error: ${error.message}`;
  }
}

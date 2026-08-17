export async function generate(prompt: string): Promise<string> {
  if (process.env.AI_PROVIDER === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY as string,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.content[0].text;
  }

  const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL ?? 'gemma4:26b',
      prompt,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.response;
}
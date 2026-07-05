export async function generateVideoPlan(character: any, customPrompt: string, duration: string) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      character,
      customPrompt,
      duration
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate plan');
  }

  const data = await response.json();
  return data.result || "{}";
}

export async function generateImageFromPrompt(parts: any[]) {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ parts })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate image');
  }

  const data = await response.json();
  return data.result;
}

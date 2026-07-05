import { useState, useEffect } from 'react';

export function useSettings() {
  const [apiKeys, setApiKeys] = useState<{ gemini: string; kling: string }>({ gemini: "", kling: "" });

  useEffect(() => {
    const keys = localStorage.getItem('pov_api_keys');
    if (keys) {
      try {
        const parsed = JSON.parse(keys);
        setApiKeys(parsed);
      } catch(e) {
        console.error("Failed to parse API keys", e);
      }
    }
  }, []);

  return { apiKeys };
}

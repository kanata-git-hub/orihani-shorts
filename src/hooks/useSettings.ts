import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

let globalAi = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });

export function getAiInstance() {
  return globalAi;
}

export function useSettings() {
  const [apiKeys, setApiKeys] = useState<{ gemini: string; kling: string }>({ gemini: "", kling: "" });

  useEffect(() => {
    const keys = localStorage.getItem('pov_api_keys');
    if (keys) {
      try {
        const parsed = JSON.parse(keys);
        setApiKeys(parsed);
        if (parsed.gemini) {
          globalAi = new GoogleGenAI({ apiKey: parsed.gemini });
        }
      } catch(e) {
        console.error("Failed to parse API keys", e);
      }
    }
  }, []);

  return { apiKeys, getAiInstance };
}

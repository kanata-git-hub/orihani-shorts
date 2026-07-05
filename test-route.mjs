import { GoogleGenAI } from "@google/genai";
console.log("Length in test script:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
ai.models.generateContent({
  model: "gemini-3.5-pro",
  contents: "Hello"
}).then(res => console.log(res.text)).catch(err => console.error(err.message));

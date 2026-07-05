import { GoogleGenAI } from "@google/genai";
async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hello"
    });
    console.log("Success", res.text);
  } catch (e: any) {
    console.log("Error 3.5:", e.message, e.status);
  }
}
run();

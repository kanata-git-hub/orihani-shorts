import { GoogleGenAI } from "@google/genai";
async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.1-flash-image",
      contents: { parts: [{ text: "A cat" }] },
      config: {
        imageConfig: {
          aspectRatio: "9:16",
          imageSize: "1K",
          addWatermark: false
        } as any
      }
    });
    console.log("Success Image!");
  } catch (e: any) {
    console.log("Error Image:", e.message, e.status);
  }
}
run();

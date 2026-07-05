import { createServer } from "vite";
console.log("Before:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
createServer({
  server: { middlewareMode: true },
  appType: "spa",
}).then(async (server) => {
  console.log("After:", process.env.GEMINI_API_KEY);
  await server.close();
});

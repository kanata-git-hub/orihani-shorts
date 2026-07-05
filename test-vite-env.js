const { createServer } = require("vite");
console.log("Before:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
createServer({
  server: { middlewareMode: true },
  appType: "spa",
}).then(() => {
  console.log("After:", process.env.GEMINI_API_KEY);
});

import { extractCaptions } from "./src/utils/extractors";

const text = `
### 3. AI Caption Data (JSON)
\`\`\`json
[
  { "text": "모니터로 들어갈 뻔", "startTime": 0, "endTime": 5 }
]
\`\`\`
`;

console.log(extractCaptions(text));

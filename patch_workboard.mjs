import fs from 'fs';
let code = fs.readFileSync('src/components/WorkboardContent.tsx', 'utf8');

code = code.replace(
  "<ReactMarkdown>{result}</ReactMarkdown>",
  `{result.trim().startsWith('{') ? (
                  <pre className="whitespace-pre-wrap font-mono text-xs">{JSON.stringify(JSON.parse(result), null, 2)}</pre>
                ) : (
                  <ReactMarkdown>{result}</ReactMarkdown>
                )}`
);
fs.writeFileSync('src/components/WorkboardContent.tsx', code);

let historyCode = fs.readFileSync('src/components/HistoryContent.tsx', 'utf8');
historyCode = historyCode.replace(
  "<ReactMarkdown>{result}</ReactMarkdown>",
  `{result.trim().startsWith('{') ? (
            <pre className="whitespace-pre-wrap font-mono text-xs">{JSON.stringify(JSON.parse(result), null, 2)}</pre>
          ) : (
            <ReactMarkdown>{result}</ReactMarkdown>
          )}`
);
fs.writeFileSync('src/components/HistoryContent.tsx', historyCode);

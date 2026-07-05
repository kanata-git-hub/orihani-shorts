import fs from 'fs';
let code = fs.readFileSync('src/components/HistoryContent.tsx', 'utf8');

code = code.replace(
  /<ReactMarkdown>\{result\}<\/ReactMarkdown>/,
  '<pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto p-4 bg-gray-100 rounded">{result}</pre>'
);
fs.writeFileSync('src/components/HistoryContent.tsx', code);

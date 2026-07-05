import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const blob = new Blob([contentToExport], { type: 'text/markdown' });",
  `const isJson = contentToExport.trim().startsWith('{');
    const type = isJson ? 'application/json' : 'text/markdown';
    const blob = new Blob([contentToExport], { type });`
);

code = code.replace(
  "a.download = `video-plan-${Date.now()}.md`;",
  "a.download = `video-plan-${Date.now()}.${isJson ? 'json' : 'md'}`;"
);

fs.writeFileSync('src/App.tsx', code);

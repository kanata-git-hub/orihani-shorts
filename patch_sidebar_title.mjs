import fs from 'fs';
let code = fs.readFileSync('src/components/HistorySidebar.tsx', 'utf8');

code = code.replace(
  /const titleMatch = item\.result\.match\(\/\\\*\\\*\(\.\*\?제목\.\*\?\)\\\*\\\*\\s\*\(\.\*\)\/\);\n\s*const displayTitle = titleMatch \? titleMatch\[2\]\.replace\(\/\[\\\[\\\]\*\]\/g, ''\)\.trim\(\) : 'Video Plan';/,
  `let displayTitle = 'Video Plan';
                try {
                  const data = JSON.parse(item.result);
                  if (data.title) displayTitle = data.title;
                } catch(e) {
                  const titleMatch = item.result.match(/\\*\\*(.*?제목.*?)\\*\\*\\s*(.*)/);
                  if (titleMatch) displayTitle = titleMatch[2].replace(/[\\[\\]*]/g, '').trim();
                }`
);
fs.writeFileSync('src/components/HistorySidebar.tsx', code);

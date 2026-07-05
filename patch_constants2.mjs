import fs from 'fs';
let code = fs.readFileSync('src/constants.ts', 'utf8');
code = code.replace("마크다운 기호(```json 등)", "마크다운 기호(\\`\\`\\`json 등)");
fs.writeFileSync('src/constants.ts', code);

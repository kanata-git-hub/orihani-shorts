import fs from 'fs';
let code = fs.readFileSync('src/utils/extractors.ts', 'utf8');

// Patch section1Regex
code = code.replace(
  "const section1Regex = /(?:###\\s*)?(?:\\*\\*)?(?:1\\.\\s*)?(?:Image Generation(?: Prompts)?|이미지 프롬프트)[\\s\\S]*?(?=(?:###\\s*)?(?:\\*\\*)?(?:2\\.\\s*)?(?:Video Generation(?: Prompts)?|비디오 프롬프트|CLIP|$))/i;",
  "const section1Regex = /(?:###\\s*)?(?:\\*\\*)?(?:1\\.\\s*)?(?:Image Generation(?: Prompts)?|이미지 프롬프트)[\\s\\S]*?(?=(?:###\\s*)?(?:\\*\\*)?(?:2\\.\\s*)?(?:Video Generation(?: Prompts)?|비디오 프롬프트|🎥|영상 프롬프트|CLIP|$))/i;"
);

// Patch section2Regex in extractClips
code = code.replace(
  "const section2Regex = /(?:###\\s*)?2\\.\\s+Video\\s+Generation[\\s\\S]*?(?=\\n(?:###\\s*)?3|$)/i;",
  "const section2Regex = /(?:(?:###\\s*)?2\\.\\s+Video\\s+Generation|🎥?\\s*영상\\s*프롬프트\\s*마스터\\s*세트|비디오\\s*프롬프트)[\\s\\S]*?(?=\\n(?:###\\s*)?3|$)/i;"
);

// Patch extractVideoPrompt function too
code = code.replace(
  "const sectionRegex = /(?:###\\s*)?2\\.\\s+Video\\s+Generation[\\s\\S]*?(?=\\n(?:###\\s*)?3|$)/i;",
  "const sectionRegex = /(?:(?:###\\s*)?2\\.\\s+Video\\s+Generation|🎥?\\s*영상\\s*프롬프트\\s*마스터\\s*세트|비디오\\s*프롬프트)[\\s\\S]*?(?=\\n(?:###\\s*)?3|$)/i;"
);
code = code.replace(
  "return match[0].replace(/(?:###\\s*)?2\\.\\s+Video\\s+Generation[^\\n]*\\n/, '').trim();",
  "return match[0].replace(/(?:(?:###\\s*)?2\\.\\s+Video\\s+Generation|🎥?\\s*영상\\s*프롬프트\\s*마스터\\s*세트|비디오\\s*프롬프트)[^\\n]*\\n/, '').trim();"
);

fs.writeFileSync('src/utils/extractors.ts', code);

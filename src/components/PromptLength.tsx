import { KLING_PROMPT_LIMIT } from '../videoPrompt';

export function PromptLength({ text }: { text: string }) {
  const over = text.length > KLING_PROMPT_LIMIT;
  return <span className={`ori-prompt-length${over ? ' ori-prompt-length--over' : ''}`} role={over ? 'status' : undefined}
    title="복사 머리말·공백·줄바꿈 포함. 사용 중인 Kling 입력창 기준입니다.">
    {text.length.toLocaleString('ko-KR')} / {KLING_PROMPT_LIMIT.toLocaleString('ko-KR')}자{over && ' · 초과, 끝부분 잘림 주의'}
  </span>;
}

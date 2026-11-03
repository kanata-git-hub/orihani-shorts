import { spawn } from 'node:child_process';

const mediaEnvironmentKeys = [
  'PATH', 'HOME', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TMPDIR', 'TEMP', 'TMP',
  'XDG_DATA_HOME', 'XDG_CACHE_HOME', 'FONTCONFIG_PATH', 'FONTCONFIG_FILE',
  'SystemRoot', 'WINDIR', 'USERPROFILE', 'LOCALAPPDATA',
];

// Media tools need local fonts and temporary files, never the server's credentials.
export function spawnMediaProcess(binary: string, args: string[], cwd: string, signal?: AbortSignal) {
  const env: NodeJS.ProcessEnv = { PYTHONUTF8: '1' };
  for (const key of mediaEnvironmentKeys) {
    const value = process.env[key];
    if (value !== undefined) env[key] = value;
  }
  return spawn(binary, args, { cwd, env, signal, windowsHide: true });
}

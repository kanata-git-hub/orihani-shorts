import { spawn } from 'node:child_process';

const mediaEnvironmentKeys = [
  'PATH', 'HOME', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TMPDIR', 'TEMP', 'TMP',
  'XDG_DATA_HOME', 'XDG_CACHE_HOME', 'FONTCONFIG_PATH', 'FONTCONFIG_FILE',
  'SystemRoot', 'WINDIR', 'USERPROFILE', 'LOCALAPPDATA',
];

// Media tools need local fonts and temporary files, never the server's credentials.
export function runMediaProcess(
  binary: string, args: string[], cwd: string, signal: AbortSignal | undefined,
  failureMessage: (log: string) => string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    const env: NodeJS.ProcessEnv = { PYTHONUTF8: '1' };
    for (const key of mediaEnvironmentKeys) {
      const value = process.env[key];
      if (value !== undefined) env[key] = value;
    }
    const child = spawn(binary, args, { cwd, env, signal, killSignal: 'SIGKILL', windowsHide: true });
    let log = '';
    let processError: Error | undefined;
    const collect = (chunk: Buffer) => { log = (log + chunk.toString('utf8')).slice(-24000); };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    const timer = setTimeout(() => child.kill('SIGKILL'), 240000);
    // AbortError can precede termination. Keep the editor slot and temp files until close.
    child.on('error', error => { processError = error; });
    child.once('close', code => {
      clearTimeout(timer);
      if (processError) reject(processError);
      else if (code !== 0) reject(Error(failureMessage(log), { cause: log }));
      else resolve(log);
    });
  });
}

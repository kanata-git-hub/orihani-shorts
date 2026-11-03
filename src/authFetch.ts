import { ownsSession } from './accountSession';
import { auth } from './lib/firebase';

// Refresh Firebase ID tokens automatically, without changing the existing login flow.
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!path.startsWith('/api/') || path.startsWith('//')) throw Error('Invalid API path');
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user || !ownsSession(auth.app.options.projectId || '', user.uid)) throw Error('로그인 후 사용해주세요.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
  if (auth.currentUser !== user) throw Error('계정이 바뀌었습니다. 다시 로그인해주세요.');
  return fetch(path, { ...init, headers, credentials: 'same-origin' });
}

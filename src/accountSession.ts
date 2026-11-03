// A document owns one authenticated workspace for its entire lifetime. Never retarget
// an old closure or pending IndexedDB save to a different user's workspace.
let owner: string | undefined;

function identity(project: string, uid: string) {
  return JSON.stringify([project, uid]);
}

export function bindAccount(project: string, uid: string | null): boolean {
  if (!uid) return owner === undefined;
  if (!project) return false;
  const next = identity(project, uid);
  if (owner === undefined) owner = next;
  return owner === next;
}

export function ownsSession(project: string, uid: string): boolean {
  return owner === identity(project, uid);
}

export function accountKey(name: string): string {
  if (!owner) throw Error('로그인 후 사용해주세요.');
  // Unscoped records have no trustworthy owner. Preserve them without opening,
  // copying or deleting them from an authenticated session.
  return name + ':' + owner;
}

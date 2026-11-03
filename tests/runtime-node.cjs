// Run inside the production image, including the native ARM64 CI job.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { rootCertificates, createSecureContext } = require('node:tls');

assert.notEqual(process.getuid(), 0);
assert.match(process.version, /^v22\./);
assert.ok(process.versions.openssl && process.versions.modules && process.versions.icu);
assert.doesNotMatch(execFileSync('ldd', [process.execPath], { encoding: 'utf8' }), /not found/);
assert.deepEqual(Intl.DateTimeFormat.supportedLocalesOf(['ko-KR']), ['ko-KR']);
assert.equal(new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul' }).resolvedOptions().timeZone, 'Asia/Seoul');
assert.ok(rootCertificates.length > 0);
createSecureContext({ ca: readFileSync('/etc/ssl/certs/ca-certificates.crt') });
console.log('Runtime:', process.version, process.arch, 'OpenSSL', process.versions.openssl, 'ICU', process.versions.icu);

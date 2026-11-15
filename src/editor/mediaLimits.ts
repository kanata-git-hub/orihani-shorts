// Cloud Run's HTTP/1 request limit is 32 MiB. Keep one MiB of
// platform headroom and reserve multipart/plan overhead before accepting media.
export const MAX_MEDIA_FILE_BYTES = 30 * 1024 * 1024;
export const MAX_MEDIA_REQUEST_BYTES = 31 * 1024 * 1024;
export const MAX_MEDIA_PAYLOAD_BYTES = MAX_MEDIA_REQUEST_BYTES - 64 * 1024;

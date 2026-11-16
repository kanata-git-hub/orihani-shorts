// Cloud Run's fixed HTTP/1 ceiling is 32 MiB. Leave 64 KiB of platform
// headroom, then another 64 KiB for multipart framing and the plan field.
export const MAX_MEDIA_REQUEST_BYTES = 32 * 1024 * 1024 - 64 * 1024;
export const MAX_MEDIA_PAYLOAD_BYTES = MAX_MEDIA_REQUEST_BYTES - 64 * 1024;
export const MAX_MEDIA_FILE_BYTES = MAX_MEDIA_PAYLOAD_BYTES;
export const MEDIA_UPLOAD_LIMIT_LABEL = '33.4MB(약 31.9MiB)';

export function getFilenameFromContentDispositionHeader(headers: Headers) {
  return headers?.get("Content-Disposition")?.split("common.filename")?.[1];
}

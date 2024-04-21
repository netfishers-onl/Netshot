export function getFilenameFromContentDispositionHeader(headers: Headers) {
  return headers?.get("Content-Disposition")?.split("filename=")?.[1];
}

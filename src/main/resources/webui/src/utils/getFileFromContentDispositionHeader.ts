export function getFilenameFromContentDispositionHeader(headers: Headers) {
  const header = headers?.get("Content-Disposition")
  if (!header) return undefined

  return header.match(/filename="?([^";]+)"?/)?.[1]
}

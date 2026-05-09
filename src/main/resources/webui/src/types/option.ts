export type Option<V = unknown, L = string> = {
  label: L
  value: V
  description?: string
  colorPalette?: string
  [k: string]: unknown
}

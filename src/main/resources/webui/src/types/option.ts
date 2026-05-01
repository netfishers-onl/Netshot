export type Option<V = unknown, L = string> = {
  label: L
  value: V
  description?: string
  [k: string]: unknown
}

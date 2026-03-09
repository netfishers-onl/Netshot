export type Option<V = unknown, L = string> = {
  label: L
  value: V
  [k: string]: unknown
}

export const useNoMemo = <const T>(factory: () => T): T => {
  "use no memo"
  return factory()
}

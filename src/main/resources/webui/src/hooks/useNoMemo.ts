// eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- no hooks are called, but the "use" prefix signals the "use no memo" React Compiler directive below
export const useNoMemo = <const T>(factory: () => T): T => {
  "use no memo"
  return factory()
}

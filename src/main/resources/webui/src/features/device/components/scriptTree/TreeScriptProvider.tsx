import { Script } from "@/types"
import { createContext, JSX, PropsWithChildren, use } from "react"

export type TreeScriptContextProps = {
  isFolderOpen(key: string): boolean
  toggleFolderOpen(key: string): void
  showMenu?: boolean
  onScriptSelect?(script: Script): void
  onFolderSelect?(path: string): void
  isSelected?(script: Script): boolean
  renderScriptChildren?(script: Script): JSX.Element
}

export const TreeScriptContext = createContext<TreeScriptContextProps>(null!)

export const useTreeScript = () => use(TreeScriptContext)

export function TreeScriptProvider({
  children,
  isFolderOpen,
  toggleFolderOpen,
  showMenu = false,
  onScriptSelect,
  onFolderSelect,
  isSelected,
  renderScriptChildren,
}: PropsWithChildren<TreeScriptContextProps>) {
  return (
    <TreeScriptContext
      value={{
        isFolderOpen,
        toggleFolderOpen,
        showMenu,
        onScriptSelect,
        onFolderSelect,
        isSelected,
        renderScriptChildren,
      }}
    >
      {children}
    </TreeScriptContext>
  )
}

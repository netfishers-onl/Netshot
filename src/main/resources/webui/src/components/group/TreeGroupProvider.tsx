import { Group } from "@/types"
import { createContext, JSX, PropsWithChildren, useContext } from "react"

export type TreeGroupContextProps = {
  expandedKeys: string[]
  showMenu?: boolean
  onGroupSelect?(group: Group): void
  isSelected(group: Group): boolean
  renderGroupChildren?(group: Group): JSX.Element
}

export const TreeGroupContext = createContext<TreeGroupContextProps>(null!)

export const useTreeGroup = () => useContext(TreeGroupContext)

export function TreeGroupProvider({
  children,
  expandedKeys = [],
  showMenu = false,
  onGroupSelect,
  isSelected,
  renderGroupChildren,
}: PropsWithChildren<TreeGroupContextProps>) {
  return (
    <TreeGroupContext.Provider
      value={{
        expandedKeys,
        showMenu,
        onGroupSelect,
        isSelected,
        renderGroupChildren,
      }}
    >
      {children}
    </TreeGroupContext.Provider>
  )
}

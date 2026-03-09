import { Group } from "@/types"
import { findNodeWithPath, isGroup } from "@/utils"
import { JSX } from "react"
import GroupOrFolderItem from "./GroupOrFolderItem"
import { TreeGroupProvider } from "./TreeGroupProvider"

export type Folder = {
  name: string
  children: Array<Folder | Group>
}

type FolderOrGroup = Folder | Group

export type TreeGroupProps = {
  items: FolderOrGroup[]
  onGroupSelect?(group: Group): void
  isSelected?(group: Group): boolean
  renderGroupChildren?(group: Group): JSX.Element
  expandedKeys?: string[]
  showMenu?: boolean
}

export function TreeGroup({
  items,
  onGroupSelect,
  isSelected,
  renderGroupChildren,
  expandedKeys = [],
  showMenu = false,
}: TreeGroupProps) {
  return (
    <TreeGroupProvider
      expandedKeys={expandedKeys}
      onGroupSelect={onGroupSelect}
      isSelected={isSelected}
      renderGroupChildren={renderGroupChildren}
      showMenu={showMenu}
    >
      {items?.map((item) => (
        <GroupOrFolderItem item={item} key={isGroup(item) ? item?.id : item?.name} />
      ))}
    </TreeGroupProvider>
  )
}

export function getExpandedKeys(items: FolderOrGroup[], groupId: number) {
  const result = findNodeWithPath(items, groupId)
  return result.path.map((p) => p.name)
}

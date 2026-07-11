import { Group } from "@/types"

export type Folder = {
  name: string
  children: Array<Folder | Group>
}

/**
 * Check if current object is a group
 */
export function isGroup(x: any): x is Group {
  return "type" in x
}

/**
 * Check if current object is a folder
 */
export function isFolder(x: any): x is Folder {
  return "children" in x
}

/**
 * Sort folders before groups; folders by name, groups by name then by id.
 */
export function compareFolderOrGroup(a: Folder | Group, b: Folder | Group) {
  const aIsFolder = isFolder(a)
  const bIsFolder = isFolder(b)

  if (aIsFolder !== bIsFolder) {
    return aIsFolder ? -1 : 1
  }

  if (aIsFolder && bIsFolder) {
    return a.name.localeCompare(b.name)
  }

  const group1 = a as Group
  const group2 = b as Group

  return group1.name.localeCompare(group2.name) || group1.id - group2.id
}

export function addFolder(
  paths: string[],
  group: Group,
  children: Folder["children"]
) {
  const name = paths.shift()
  let folder = children.find((f) => f.name === name) as Folder

  if (!folder) {
    folder = { name, children: [] } as Folder
    children.push(folder)
  }

  if (paths.length) {
    addFolder(paths, group, folder.children || (folder.children = []))
  } else {
    folder.children.push(group)
  }

  return children.sort(compareFolderOrGroup)
}

/**
 * Create nested list of folder with groups from netshot backend
 */
export function createFoldersFromGroups(deviceGroups: Group[] = []) {
  return deviceGroups
    .reduce(
      (arr, group) => {
        if (group.folder === "") {
          arr.push(group)
        } else {
          addFolder(group.folder.split("/"), group, arr)
        }

        return arr
      },
      [] as Array<Folder | Group>
    )
    .sort(compareFolderOrGroup)
}

interface FindResult {
  node: Folder | Group
  path: Folder[]
}

export function findNodeWithPath(
  tree: Array<Folder | Group>,
  id: number,
  path: Folder[] = []
): FindResult | null {
  for (const node of tree) {
    if (isGroup(node) && node.id === id) {
      return { node, path }
    }

    if (isFolder(node)) {
      const result = findNodeWithPath(node.children, id, [...path, node])
      if (result) return result
    }
  }

  return null
}

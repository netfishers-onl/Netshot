import { Group } from "@/types";
import { Folder, isGroup } from "@/utils";
import { BoxProps } from "@chakra-ui/react";
import FolderItem from "./FolderItem";
import GroupItem from "./GroupItem";

export type GroupOrFolderItemProps = {
  item: Group | Folder;
  onGroupSelect(group: Group): void;
} & BoxProps;

export default function GroupOrFolderItem(props: GroupOrFolderItemProps) {
  const { item, onGroupSelect, ...other } = props;

  return isGroup(item) ? (
    <GroupItem group={item} onGroupSelect={onGroupSelect} {...other} />
  ) : (
    <FolderItem folder={item} onGroupSelect={onGroupSelect} {...other} />
  );
}

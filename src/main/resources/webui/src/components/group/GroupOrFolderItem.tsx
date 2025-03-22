import { Group } from "@/types";
import { Folder, isGroup } from "@/utils";
import { BoxProps } from "@chakra-ui/react";
import { PropsWithChildren, ReactElement } from "react";
import FolderItem from "./FolderItem";
import GroupItem from "./GroupItem";

export type GroupOrFolderItemProps = {
  item: Group | Folder;
  showMenu?: boolean;
  onGroupSelect?(group: Group): void;
  isSelected?(group: Group): boolean;
  renderGroupChildren?(group: Group): ReactElement;
} & BoxProps;

export default function GroupOrFolderItem(
  props: PropsWithChildren<GroupOrFolderItemProps>
) {
  const {
    item,
    showMenu = false,
    onGroupSelect,
    isSelected,
    renderGroupChildren,
    ...other
  } = props;

  return isGroup(item) ? (
    <GroupItem
      group={item}
      showMenu={showMenu}
      onGroupSelect={onGroupSelect}
      isSelected={isSelected}
      renderGroupChildren={renderGroupChildren}
      {...other}
    />
  ) : (
    <FolderItem
      folder={item}
      showMenu={showMenu}
      onGroupSelect={onGroupSelect}
      isSelected={isSelected}
      renderGroupChildren={renderGroupChildren}
      {...other}
    />
  );
}

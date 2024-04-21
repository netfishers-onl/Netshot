import Icon from "@/components/Icon";
import { Group } from "@/types";
import { Folder, isGroup } from "@/utils";
import { Box, BoxProps, Flex, Stack, Text } from "@chakra-ui/react";
import { motion, useAnimationControls } from "framer-motion";
import { MouseEvent, useCallback, useState } from "react";
import GroupOrFolderItem from "./GroupOrFolderItem";

export type FolderItemProps = {
  folder: Folder;
  onGroupSelect(group: Group);
} & BoxProps;

export default function FolderItem(props: FolderItemProps) {
  const { folder, onGroupSelect, ...other } = props;
  const controls = useAnimationControls();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  const toggleCollapse = useCallback(
    async (evt: MouseEvent) => {
      evt.stopPropagation();
      setIsCollapsed((prev) => !prev);
      await controls.start(isCollapsed ? "show" : "hidden");
    },
    [controls, isCollapsed]
  );

  return (
    <Box {...other}>
      <Stack direction="column" spacing="0" onClick={toggleCollapse}>
        <Flex
          borderRadius="xl"
          transition="all .2s ease"
          pl="2"
          ml="-2"
          cursor="pointer"
          h="40px"
          _hover={{
            bg: "green.50",
          }}
        >
          <Stack direction="row" spacing="3" alignItems="center">
            <Icon
              name="chevronDown"
              color="grey.500"
              sx={{
                transform: isCollapsed ? "rotate(-90deg)" : "",
              }}
            />
            <Stack direction="row" spacing="3" alignItems="center">
              <Icon name="folder" color="green.600" />
              <Text>{folder?.name}</Text>
            </Stack>
          </Stack>
        </Flex>
        <motion.div
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { opacity: 0, height: 0, pointerEvents: "none" },
            show: {
              opacity: 1,
              height: "auto",
              pointerEvents: "all",
            },
          }}
          transition={{
            duration: 0.2,
          }}
        >
          <Stack direction="column" spacing="0">
            {folder?.children?.map((child) => (
              <GroupOrFolderItem
                pl="6"
                item={child}
                key={isGroup(child) ? child?.id : child?.name}
                onGroupSelect={onGroupSelect}
              />
            ))}
          </Stack>
        </motion.div>
      </Stack>
    </Box>
  );
}

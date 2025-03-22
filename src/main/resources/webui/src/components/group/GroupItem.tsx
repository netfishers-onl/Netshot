import { Protected } from "@/components";
import Icon from "@/components/Icon";
import { Group, Level } from "@/types";
import {
  Box,
  BoxProps,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react";
import { MouseEvent, ReactElement, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import EditGroupButton from "./EditGroupButton";
import RemoveGroupButton from "./RemoveGroupButton";
import { useSearchParams } from "react-router";

export type GroupItemProps = {
  group: Group;
  showMenu: boolean;
  onGroupSelect?(group: Group): void;
  isSelected?(group: Group): boolean;
  renderGroupChildren?(group: Group): ReactElement;
} & BoxProps;

export default function GroupItem(props: GroupItemProps) {
  const { group, showMenu, onGroupSelect, isSelected, renderGroupChildren, ...other } =
    props;

  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const isRouteParamsSelected = useMemo(() => {
    return (group.id === parseInt(searchParams.get("group")));
  }, [searchParams, group]);

  const selected = isRouteParamsSelected || (isSelected ? isSelected(group) : false);

  const select = useCallback(
    (evt: MouseEvent<HTMLDivElement>) => {
      if (!onGroupSelect) {
        return;
      }

      evt.stopPropagation();
      onGroupSelect(group);
    },
    [onGroupSelect, group]
  );

  return (
    <Box {...other}>
      <Flex
        borderRadius="xl"
        transition="all .2s ease"
        cursor="pointer"
        pl="2"
        ml="-2"
        minHeight="40px"
        _hover={{
          bg: selected ? "green.50" : "grey.50",
        }}
        bg={selected ? "green.50" : "white"}
        onClick={select}
      >
        <Stack direction="row" spacing="3" alignItems="center">
          <Stack direction="row" spacing="3" alignItems="center">
            <Icon name="code" color="green.600" />
            <Text>{group?.name}</Text>
          </Stack>
        </Stack>
        <Spacer />
        {renderGroupChildren?.(group)}
        {showMenu &&
          <Protected minLevel={Level.ReadWrite}>
            <Menu>
              <MenuButton
                as={IconButton}
                variant="ghost"
                icon={<Icon name="moreHorizontal" />}
                aria-label="Open group options"
                onClick={(e) => e.stopPropagation()}
              />
              <MenuList>
                <EditGroupButton
                  group={group}
                  renderItem={(open) => (
                    <MenuItem icon={<Icon name="edit" />} onClick={open}>
                      {t("Edit")}
                    </MenuItem>
                  )}
                />

                <RemoveGroupButton
                  group={group}
                  renderItem={(open) => (
                    <MenuItem icon={<Icon name="trash" />} onClick={open}>
                      {t("Remove")}
                    </MenuItem>
                  )}
                />
              </MenuList>
            </Menu>
          </Protected>}
      </Flex>
    </Box>
  );
}

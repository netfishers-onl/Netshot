import { Protected } from "@/components";
import Icon from "@/components/Icon";
import { useQueryParams } from "@/hooks";
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
import { MouseEvent, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import EditGroupButton from "./EditGroupButton";
import RemoveGroupButton from "./RemoveGroupButton";

export type GroupItemProps = {
  group: Group;
  onGroupSelect(group: Group);
} & BoxProps;

export default function GroupItem(props: GroupItemProps) {
  const { group, onGroupSelect, ...other } = props;

  const { t } = useTranslation();
  const queryParams = useQueryParams();
  const isSelected = useMemo(() => {
    if (queryParams.has("group")) {
      return group.id === queryParams.get("group", Number);
    }

    return false;
  }, [queryParams, group]);

  const select = useCallback(
    (evt: MouseEvent<HTMLDivElement>) => {
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
          bg: "green.50",
        }}
        bg={isSelected ? "green.50" : "white"}
        onClick={select}
      >
        <Stack direction="row" spacing="3" alignItems="center">
          <Stack direction="row" spacing="3" alignItems="center">
            <Icon name="code" color="green.600" />
            <Text>{group?.name}</Text>
          </Stack>
        </Stack>
        <Spacer />
        <Protected
          roles={[
            Level.Admin,
            Level.Operator,
            Level.ReadWriteCommandOnDevice,
            Level.ReadWrite,
          ]}
        >
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
        </Protected>
      </Flex>
    </Box>
  );
}

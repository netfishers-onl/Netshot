import { Protected } from "@/components"
import { Icon } from "@chakra-ui/react"
import { LuCode, LuSquarePen, LuEllipsis, LuTrash } from "react-icons/lu"
import { Group, Level } from "@/types"
import {
  Box,
  BoxProps,
  Flex,
  IconButton,
  Menu,
  Portal,
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react"
import { MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import EditGroupButton from "./EditGroupButton"
import RemoveGroupButton from "./RemoveGroupButton"
import { useTreeGroup } from "./TreeGroupProvider"

export type GroupItemProps = {
  group: Group
} & BoxProps

export default function GroupItem(props: GroupItemProps) {
  const { group, ...other } = props

  const { t } = useTranslation()
  const ctx = useTreeGroup()

  const selected = ctx.isSelected ? ctx.isSelected(group) : false

  function select(evt: MouseEvent<HTMLDivElement>) {
    if (!ctx.onGroupSelect) {
      return
    }

    evt?.stopPropagation()
    ctx.onGroupSelect(group)
  }

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
        <Stack direction="row" gap="3" alignItems="center">
          <Stack direction="row" gap="3" alignItems="center">
            <Icon color="green.600"><LuCode /></Icon>
            <Text>{group?.name}</Text>
          </Stack>
        </Stack>
        <Spacer />
        {ctx.renderGroupChildren?.(group)}
        {ctx.showMenu && (
          <Protected minLevel={Level.ReadWrite}>
            <Menu.Root>
              <Menu.Trigger asChild>
                <IconButton
                  variant="ghost"
                  aria-label="Open group options"
                  onClick={(e) => e.stopPropagation()}
                >
                  <LuEllipsis />
                </IconButton>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <EditGroupButton
                      group={group}
                      renderItem={(open) => (
                        <Menu.Item onSelect={() => open(null)} value="item-0">
                          <LuSquarePen />
                          {t("common.edit")}
                        </Menu.Item>
                      )}
                    />
                    <RemoveGroupButton
                      group={group}
                      renderItem={(open) => (
                        <Menu.Item onSelect={() => open(null)} value="item-1">
                          <LuTrash />
                          {t("common.remove")}
                        </Menu.Item>
                      )}
                    />
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </Protected>
        )}
      </Flex>
    </Box>
  )
}

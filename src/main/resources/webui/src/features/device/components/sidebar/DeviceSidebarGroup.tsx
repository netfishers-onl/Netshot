import { AddGroupTrigger, Protected, TreeGroup } from "@/components"
import { Tooltip } from "@/components/ui/tooltip"
import { Group, Level } from "@/types"
import { Folder } from "@/utils"
import { Flex, Heading, IconButton, Skeleton, Stack } from "@chakra-ui/react"
import { LuPlus } from "react-icons/lu"
import { useTranslation } from "react-i18next"

export type DeviceSidebarGroupProps = {
  items: Array<Folder | Group>
  isPending: boolean
  selectedGroupId: number
  onGroupSelect(group: Group): void
  isFolderOpen(key: string): boolean
  toggleFolderOpen(key: string): void
}

export default function DeviceSidebarGroup(props: DeviceSidebarGroupProps) {
  const { items, isPending, selectedGroupId, onGroupSelect, isFolderOpen, toggleFolderOpen } = props
  const { t } = useTranslation()

  return (
    <Stack gap="0">
      <Flex justifyContent="space-between" alignItems="center" px="4" pt="3" pb="1">
        <Heading fontSize="md" fontWeight="medium">
          {t("group.list")}
        </Heading>
        <Protected minLevel={Level.ReadWrite}>
          <Tooltip content={t("group.add")}>
            <AddGroupTrigger>
              <IconButton variant="ghost" size="sm" aria-label={t("group.add")}>
                <LuPlus />
              </IconButton>
            </AddGroupTrigger>
          </Tooltip>
        </Protected>
      </Flex>
      <Stack px="4" pb="3" gap="0" overflow="auto" maxHeight="280px">
        {isPending ? (
          <Stack gap="3" pb="4">
            <Skeleton height="36px" />
            <Skeleton height="36px" />
            <Skeleton height="36px" />
            <Skeleton height="36px" />
          </Stack>
        ) : (
          <TreeGroup
            items={items}
            showMenu={true}
            onGroupSelect={onGroupSelect}
            isSelected={(group) => group.id === selectedGroupId}
            isFolderOpen={isFolderOpen}
            toggleFolderOpen={toggleFolderOpen}
          />
        )}
      </Stack>
    </Stack>
  )
}

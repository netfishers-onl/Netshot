import api from "@/api"
import { getExpandedKeys, TreeGroup } from "@/components"
import { QUERIES } from "@/constants"
import { usePagination } from "@/hooks"
import { Group } from "@/types"
import { createFoldersFromGroups, Folder, search } from "@/utils"
import { Skeleton, Stack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router"
import { useConfigurationComplianceSidebarStore } from "../stores/useConfigurationComplianceSidebarStore"

export default function ConfigurationCompliantSidebarList() {
  const navigate = useNavigate()
  const pagination = usePagination()
  const query = useConfigurationComplianceSidebarStore((state) => state.query)
  const params = useParams<{ id: string }>()

  const { data: items, isPending } = useQuery({
    queryKey: [QUERIES.DEVICE_GROUPS, query],
    queryFn: async () => {
      return api.group.getAll(pagination)
    },
    select(groups: Group[]): (Group | Folder)[] {
      return createFoldersFromGroups(search(groups, "name").with(query))
    },
  })

  function onGroupSelect(group: Group) {
    navigate(`./${group.id}`, {
      replace: true,
    })
  }

  let expandedKeys: string[] = []

  if (items?.length > 0 && params.id) {
    expandedKeys = getExpandedKeys(items, +params.id)
  }

  return (
    <Stack px="6" pt="3" flex="1" overflow="auto">
      {isPending ? (
        <Stack gap="3" pb="6">
          <Skeleton height="36px" />
          <Skeleton height="36px" />
          <Skeleton height="36px" />
          <Skeleton height="36px" />
        </Stack>
      ) : (
        <TreeGroup
          items={items}
          expandedKeys={expandedKeys}
          onGroupSelect={onGroupSelect}
          isSelected={(group) => group.id === +params.id}
        />
      )}
    </Stack>
  )
}

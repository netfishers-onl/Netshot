import api from "@/api"
import { getExpandedKeys, getVisibleGroups, TreeGroup, useTreeOpenKeys } from "@/components"
import { QUERIES } from "@/constants"
import { useArrowKeyNavigation, usePagination } from "@/hooks"
import { Group } from "@/types"
import { createFoldersFromGroups, Folder, search } from "@/utils"
import { Skeleton, Stack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"
import { useNavigate, useParams } from "react-router"
import { useShallow } from "zustand/react/shallow"
import { QUERIES as REPORT_QUERIES } from "../constants"
import { useConfigurationComplianceSidebarStore } from "../stores/useConfigurationComplianceSidebarStore"

export default function ConfigurationCompliantSidebarList() {
  const navigate = useNavigate()
  const pagination = usePagination()
  const { query, domains, policies } = useConfigurationComplianceSidebarStore(
    useShallow((state) => ({
      query: state.query,
      domains: state.domains,
      policies: state.policies,
    }))
  )
  const params = useParams<{ id: string }>()

  const { data: groups, isPending: isGroupsPending } = useQuery({
    queryKey: [QUERIES.DEVICE_GROUPS],
    queryFn: async () => {
      return api.group.getAll(pagination)
    },
  })

  const { data: stats, isPending: isStatsPending } = useQuery({
    queryKey: [REPORT_QUERIES.CONFIGURATION_COMPLIANCE_STAT, domains.sort().join(","), policies.sort().join(",")],
    queryFn: async () => {
      return api.report.getAllGroupConfigComplianceStats({ domain: domains, policy: policies })
    },
    gcTime: 0,
  })

  const isPending = isGroupsPending || isStatsPending

  const items = useMemo((): (Group | Folder)[] => {
    if (!groups) return []

    const nonEmptyGroupIds = new Set(
      (stats ?? []).filter((stat) => stat.deviceCount > 0).map((stat) => stat.groupId)
    )
    const nonEmptyGroups = groups.filter((group) => nonEmptyGroupIds.has(group.id))

    return createFoldersFromGroups(search(nonEmptyGroups, "name").with(query))
  }, [groups, stats, query])

  const onGroupSelect = useCallback(
    (group: Group) => {
      navigate(`./${group.id}`, {
        replace: true,
      })
    },
    [navigate]
  )

  const expandedKeys = useMemo(() => {
    if (items?.length > 0 && params.id) {
      return getExpandedKeys(items, +params.id)
    }
    return []
  }, [items, params.id])

  const { isOpen, toggle } = useTreeOpenKeys(expandedKeys)

  const visibleGroups = useMemo(() => getVisibleGroups(items ?? [], isOpen), [items, isOpen])
  const activeIndex = visibleGroups.findIndex((group) => group.id === +params.id)

  useArrowKeyNavigation({
    items: visibleGroups,
    activeIndex,
    onNavigate: onGroupSelect,
  })

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
          isFolderOpen={isOpen}
          toggleFolderOpen={toggle}
          onGroupSelect={onGroupSelect}
          isSelected={(group) => group.id === +params.id}
        />
      )}
    </Stack>
  )
}

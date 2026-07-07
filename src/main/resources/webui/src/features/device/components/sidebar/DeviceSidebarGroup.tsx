import api from "@/api"
import {
  AddGroupTrigger,
  getExpandedKeys,
  getVisibleGroups,
  Protected,
  TreeGroup,
  useTreeOpenKeys,
} from "@/components"
import { LuPlus } from "react-icons/lu"
import { Tooltip } from "@/components/ui/tooltip"
import { QUERIES } from "@/constants"
import { useArrowKeyNavigation, usePagination } from "@/hooks"
import { Group, Level } from "@/types"
import { createFoldersFromGroups } from "@/utils"
import { Flex, Heading, IconButton, Separator, Skeleton, Stack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate, useSearchParams } from "react-router"
import { useDeviceSidebarStore } from "../../stores"

export default function DeviceSidebarGroup() {
  const scrollContainer = useRef<HTMLDivElement>(null)
  const [scroll, setScroll] = useState<number>(0)
  const location = useLocation()
  const navigate = useNavigate()
  const setGroup = useDeviceSidebarStore((state) => state.setGroup)
  const { t } = useTranslation()
  const pagination = usePagination()
  const [searchParams] = useSearchParams()
  const selectedGroupId = +searchParams.get("group")

  const { data: items, isPending } = useQuery({
    queryKey: [QUERIES.DEVICE_GROUPS],
    queryFn: async () => api.group.getAll(pagination),
    select: createFoldersFromGroups,
  })

  useLayoutEffect(() => {
    if (!scrollContainer?.current) return

    scrollContainer.current.onscroll = (evt) => {
      const target = evt.target as HTMLDivElement

      setScroll(target.scrollTop)
    }
  }, [scrollContainer])

  const onGroupSelect = useCallback(
    (group: Group) => {
      if (group?.id === selectedGroupId) {
        navigate(
          {
            pathname: location.pathname,
            search: null,
          },
          {
            replace: true,
          }
        )

        setGroup(null)
        return
      }

      navigate(
        {
          pathname: location.pathname,
          search: `?group=${group.id}`,
        },
        { replace: true }
      )

      setGroup(group)
    },
    [selectedGroupId, navigate, location.pathname, setGroup]
  )

  const expandedKeys = useMemo(() => {
    if (items?.length > 0 && selectedGroupId) {
      return getExpandedKeys(items, selectedGroupId)
    }
    return []
  }, [items, selectedGroupId])

  const { isOpen, toggle } = useTreeOpenKeys(expandedKeys)

  const visibleGroups = useMemo(() => getVisibleGroups(items ?? [], isOpen), [items, isOpen])
  const activeIndex = visibleGroups.findIndex((group) => group.id === selectedGroupId)

  useArrowKeyNavigation({
    items: visibleGroups,
    activeIndex,
    onNavigate: onGroupSelect,
  })

  return (
    <Stack gap="0">
      <Flex justifyContent="space-between" alignItems="center" px="6" pt="3" pb="1">
        <Heading fontSize="md" fontWeight="medium">
          {t("group.list")}
        </Heading>
        <Protected minLevel={Level.ReadWrite}>
          <Tooltip content={t("group.add")}>
            <AddGroupTrigger>
              <IconButton variant="ghost" aria-label={t("group.add")}>
                <LuPlus />
              </IconButton>
            </AddGroupTrigger>
          </Tooltip>
        </Protected>
      </Flex>
      {scroll > 0 && <Separator />}
      <Stack px="6" gap="0" overflow="auto" height="200px" ref={scrollContainer}>
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
            showMenu={true}
            onGroupSelect={onGroupSelect}
            isSelected={(group) => group.id === selectedGroupId}
            isFolderOpen={isOpen}
            toggleFolderOpen={toggle}
          />
        )}
      </Stack>
    </Stack>
  )
}

import api from "@/api"
import { AddGroupButton, getExpandedKeys, Icon, Protected, TreeGroup } from "@/components"
import { Tooltip } from "@/components/ui/tooltip"
import { QUERIES } from "@/constants"
import { usePagination } from "@/hooks"
import { Group, Level } from "@/types"
import { createFoldersFromGroups } from "@/utils"
import { Flex, Heading, IconButton, Separator, Skeleton, Stack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useLayoutEffect, useRef, useState } from "react"
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

  const onGroupSelect = (group: Group) => {
    if (group?.id === group.id) {
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
  }

  let expandedKeys: string[] = []

  if (items?.length > 0 && selectedGroupId) {
    expandedKeys = getExpandedKeys(items, selectedGroupId)
  }

  return (
    <Stack gap="0">
      <Flex justifyContent="space-between" alignItems="center" px="6" pt="3" pb="1">
        <Heading fontSize="md" fontWeight="medium">
          {t("Groups")}
        </Heading>
        <Protected minLevel={Level.ReadWrite}>
          <AddGroupButton
            renderItem={(open) => (
              <Tooltip content={t("Add group")}>
                <IconButton variant="ghost" onClick={open} aria-label={t("Add group")}>
                  <Icon name="plus" />
                </IconButton>
              </Tooltip>
            )}
          />
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
            expandedKeys={expandedKeys}
          />
        )}
      </Stack>
    </Stack>
  )
}

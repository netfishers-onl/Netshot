import api from "@/api"
import { DomainSelect, Icon, Search, TreeGroup } from "@/components"
import { QUERIES as GLOBAL_QUERIES } from "@/constants"
import { useAlertDialog } from "@/dialog"
import { usePagination } from "@/hooks"
import { DeviceSoftwareLevel, Group, GroupSoftwareComplianceStat } from "@/types"
import { createFoldersFromGroups, getSoftwareLevelColor, search } from "@/utils"
import {
  Box,
  Button,
  Dialog,
  Heading,
  Menu,
  Portal,
  Skeleton,
  Spacer,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { MouseEvent, useCallback, useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import SoftwareComplianceDialog from "../components/SoftwareComplianceDialog"
import { QUERIES } from "../constants"

type FilterForm = {
  domain: number
}

type LevelTagProps = {
  level: DeviceSoftwareLevel
  count: number
}

function LevelTag(props: LevelTagProps) {
  const { level, count } = props
  const { t } = useTranslation()

  const label = useMemo(() => {
    if (level === DeviceSoftwareLevel.GOLD) {
      return t("gold")
    } else if (level === DeviceSoftwareLevel.SILVER) {
      return t("silver")
    } else if (level === DeviceSoftwareLevel.BRONZE) {
      return t("bronze")
    } else if (level === DeviceSoftwareLevel.NON_COMPLIANT) {
      return t("nonCompliant")
    } else {
      return t("unknown3")
    }
  }, [level])

  const bg = useMemo(() => {
    return getSoftwareLevelColor(level)
  }, [level])

  return (
    <Box
      h="28px"
      gap="3"
      display="flex"
      alignItems="center"
      borderWidth="1px"
      borderColor="grey.100"
      borderRadius="lg"
      pl="2"
      pr="3"
    >
      <Box w="14px" h="14px" borderRadius="4px" bg={bg} />
      <Text>
        {label}: {count}
      </Text>
    </Box>
  )
}

function ReportSoftwareComplianceGroupItem({ item }: { item: GroupSoftwareComplianceStat }) {
  const { t } = useTranslation()
  const dialog = useAlertDialog()

  const nonCompliantDeviceCount = useMemo(
    () => item.deviceCount - item.goldDeviceCount - item.silverDeviceCount - item.bronzeDeviceCount,
    [item]
  )

  const openDetail = (evt: MouseEvent<HTMLDivElement>) => {
    evt?.stopPropagation()
    dialog.open({
      title: (
        <Dialog.Header as={Stack} display="flex" direction="row" alignItems="center" gap="4">
          <Heading as="h3" fontSize="2xl" fontWeight="semibold">
            {t("softwareCompliance")}
          </Heading>

          <Tag.Root colorScheme="grey">
            <Tag.Label>{item.groupName}</Tag.Label>
          </Tag.Root>
          <Dialog.CloseTrigger />
        </Dialog.Header>
      ),
      description: <SoftwareComplianceDialog item={item} />,
      variant: "full-floating",
      hideFooter: true,
    })
  }

  return (
    <Stack onClick={openDetail} direction="row" px="6" alignItems="center" gap="4">
      <LevelTag level={DeviceSoftwareLevel.GOLD} count={item.goldDeviceCount} />
      <LevelTag level={DeviceSoftwareLevel.SILVER} count={item.silverDeviceCount} />
      <LevelTag level={DeviceSoftwareLevel.BRONZE} count={item.bronzeDeviceCount} />
      <LevelTag level={DeviceSoftwareLevel.NON_COMPLIANT} count={nonCompliantDeviceCount} />
    </Stack>
  )
}

export default function ReportSoftwareComplianceScreen() {
  const { t } = useTranslation()

  const pagination = usePagination()
  const form = useForm<FilterForm>({
    defaultValues: {
      domain: null,
    },
  })

  const domain = useWatch({
    control: form.control,
    name: "domain",
  })

  const { data, isPending, refetch } = useQuery({
    queryKey: [QUERIES.SOFTWARE_COMPLIANCE, pagination.query, domain],
    queryFn: async () => api.report.getAllGroupSoftwareComplianceStats(domain ? { domain } : {}),
    select(res) {
      return search(
        res.filter((item) => item.deviceCount > 0),
        "groupName"
      ).with(pagination.query)
    },
  })

  const { data: groups, isPending: isGroupPending } = useQuery({
    queryKey: [GLOBAL_QUERIES.DEVICE_GROUPS, pagination.query],
    queryFn: async () => {
      return api.group.getAll(pagination)
    },
    select: createFoldersFromGroups,
  })

  const clearFilter = useCallback(() => {
    form.setValue("domain", null)
  }, [form])

  const getGroupChildren = useCallback(
    (group: Group) => {
      let item = data?.find((stat) => stat.groupId === group.id)

      if (!item) {
        item = {
          groupId: group.id,
          groupName: group.name,
          deviceCount: 0,
          goldDeviceCount: 0,
          silverDeviceCount: 0,
          bronzeDeviceCount: 0,
        }
      }

      return <ReportSoftwareComplianceGroupItem item={item} />
    },
    [data]
  )

  return (
    <Stack gap="8" p="9" flex="1" overflow="auto">
      <Heading as="h1" fontSize="4xl">
        {t("softwareCompliance")}
      </Heading>
      <Stack direction="row" gap="3">
        <Search
          placeholder={t("search2")}
          onQuery={pagination.onQuery}
          onClear={pagination.onQueryClear}
          w="30%"
        />
        <Spacer />
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button variant="primary">
              <Icon name="filter" />
              {t("filters")}
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content w="240px">
                <Stack gap="6" p="3" as="form">
                  <DomainSelect control={form.control} name="domain" />
                  <Stack gap="2">
                    <Button onClick={clearFilter}>{t("clearAll")}</Button>
                  </Stack>
                </Stack>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
        <Button onClick={() => refetch()}>
          <Icon name="refreshCcw" />
          {t("refresh")}
        </Button>
      </Stack>
      <Stack flex="1" overflow="auto">
        {isGroupPending && isPending ? (
          <Stack gap="3" pb="6">
            <Skeleton height="36px" />
            <Skeleton height="36px" />
            <Skeleton height="36px" />
            <Skeleton height="36px" />
          </Stack>
        ) : (
          <TreeGroup items={groups} renderGroupChildren={getGroupChildren} />
        )}
      </Stack>
    </Stack>
  )
}

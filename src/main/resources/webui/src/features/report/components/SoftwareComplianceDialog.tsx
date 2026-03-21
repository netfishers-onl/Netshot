import api from "@/api"
import { DataTable, EmptyResult, EntityLink } from "@/components"
import { useDialogConfig } from "@/dialog"
import {
  DeviceSoftwareLevel,
  GroupDeviceBySoftwareLevel,
  GroupSoftwareComplianceStat,
} from "@/types"
import { getSoftwareLevelColor } from "@/utils"
import { Box, Skeleton, Spacer, Stack, StackProps, Tag, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { PropsWithChildren, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

const columnHelper = createColumnHelper<GroupDeviceBySoftwareLevel>()

export type SoftwareComplianceDeviceListProps = {
  level: DeviceSoftwareLevel
  groupId: number
}

function SoftwareComplianceDeviceList(props: SoftwareComplianceDeviceListProps) {
  const { level, groupId } = props
  const { t } = useTranslation()
  const dialogConfig = useDialogConfig()

  const { data, isPending } = useQuery({
    queryKey: [QUERIES.SOFTWARE_COMPLIANCE_DEVICES, level],
    queryFn: async () => api.report.getAllGroupDevicesBySoftwareLevel(groupId, level),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        cell: (info) => (
          <EntityLink
            to={`/app/devices/${info.row.original.id}/compliance`}
            onClick={() => dialogConfig.close()}
          >
            {info.getValue()}
          </EntityLink>
        ),
        header: t("deviceName"),
      }),
      columnHelper.accessor("mgmtAddress", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("managementIp"),
      }),
      columnHelper.accessor("softwareLevel", {
        cell: (info) => {
          const level = info.getValue()

          return <Tag.Root colorPalette={getSoftwareLevelColor(level)}>{level}</Tag.Root>
        },
        header: t("softwareLevel"),
      }),
    ],
    [t]
  )

  return isPending ? (
    <Stack gap="3">
      <Skeleton h="60px"></Skeleton>
      <Skeleton h="60px"></Skeleton>
      <Skeleton h="60px"></Skeleton>
      <Skeleton h="60px"></Skeleton>
    </Stack>
  ) : (
    <Stack flex="1">
      {data?.length > 0 ? (
        <DataTable columns={columns} data={data} loading={isPending} />
      ) : (
        <EmptyResult
          title={t("thereIsNoDevice")}
          description={t("deviceWithLevelAppearsWhenSoftwareRuleIsValidated", {
            level: t(level),
          })}
        />
      )}
    </Stack>
  )
}

type SoftwareComplianteDeviceBoxProps = PropsWithChildren<
  {
    level: DeviceSoftwareLevel
    count: number
    isActive: boolean
  } & StackProps
>

function SoftwareComplianteDeviceBox(props: SoftwareComplianteDeviceBoxProps) {
  const { children, level, count, isActive, ...other } = props

  const { t } = useTranslation()

  const bg = useMemo(() => {
    return getSoftwareLevelColor(level)
  }, [level])

  return (
    <Stack
      direction="row"
      alignItems="center"
      border="1px solid"
      borderColor="grey.100"
      bg={isActive ? "grey.50" : "white"}
      borderRadius="2xl"
      cursor="pointer"
      transition="all .2s ease"
      _hover={{
        bg: "grey.50",
      }}
      p="5"
      gap="3"
      {...other}
    >
      <Box w="14px" h="14px" borderRadius="4px" bg={bg} />
      {children}
      <Spacer />
      <Text>{t("device", { count })}</Text>
    </Stack>
  )
}

type SoftwareComplianceDialogProps = {
  item: GroupSoftwareComplianceStat
}

export default function SoftwareComplianceDialog(props: SoftwareComplianceDialogProps) {
  const { item } = props
  const { t } = useTranslation()
  const [selected, setSelected] = useState<DeviceSoftwareLevel>(DeviceSoftwareLevel.GOLD)

  const nonCompliantDeviceCount = useMemo(
    () => item.deviceCount - item.goldDeviceCount - item.silverDeviceCount - item.bronzeDeviceCount,
    [item]
  )

  const triggers = useMemo(
    () => [
      {
        label: t("gold"),
        level: DeviceSoftwareLevel.GOLD,
        count: item.goldDeviceCount,
      },
      {
        label: t("silver"),
        level: DeviceSoftwareLevel.SILVER,
        count: item.silverDeviceCount,
      },
      {
        label: t("bronze"),
        level: DeviceSoftwareLevel.BRONZE,
        count: item.bronzeDeviceCount,
      },
      {
        label: t("nonCompliant"),
        level: DeviceSoftwareLevel.NON_COMPLIANT,
        count: nonCompliantDeviceCount,
      },
    ],
    [t, nonCompliantDeviceCount, item]
  )

  return (
    <Stack direction="row" gap="7" overflow="auto" flex="1">
      <Stack flex="0 0 340px" overflow="auto">
        <Stack gap="2" overflow="auto">
          {triggers.map((trigger) => (
            <SoftwareComplianteDeviceBox
              key={trigger.label}
              onClick={() => setSelected(trigger.level)}
              level={trigger.level}
              count={trigger.count}
              isActive={trigger.level === selected}
            >
              <Text>{trigger.label}</Text>
            </SoftwareComplianteDeviceBox>
          ))}
        </Stack>
      </Stack>
      {selected && <SoftwareComplianceDeviceList groupId={item.groupId} level={selected} />}
    </Stack>
  )
}

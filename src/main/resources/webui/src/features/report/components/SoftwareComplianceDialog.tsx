import api from "@/api"
import { DataTable, EmptyResult, EntityLink } from "@/components"
import { useDialogConfig } from "@/dialog"
import {
  DeviceSoftwareLevel,
  GroupDeviceBySoftwareLevel,
  GroupSoftwareComplianceStat,
} from "@/types"
import { useSoftwareLevels } from "@/hooks"
import { Box, Skeleton, Spacer, Stack, StackProps, Tag, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { PropsWithChildren, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuTrophy } from "react-icons/lu"
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
  const { getColor } = useSoftwareLevels()

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
        header: t("device.name"),
      }),
      columnHelper.accessor("mgmtAddress", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("device.managementIp"),
      }),
      columnHelper.accessor("softwareLevel", {
        cell: (info) => {
          const level = info.getValue()

          const isMedalLevel = [DeviceSoftwareLevel.GOLD, DeviceSoftwareLevel.SILVER, DeviceSoftwareLevel.BRONZE].includes(level)
          return (
            <Tag.Root colorPalette={getColor(level)}>
              {isMedalLevel && <LuTrophy size={12} />}
              {level}
            </Tag.Root>
          )
        },
        header: t("compliance.software.level"),
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
          title={t("device.none")}
          description={t("device.withLevelAppearsWhenSoftwareRuleValidated", {
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
  const { getColor } = useSoftwareLevels()

  const bg = useMemo(() => {
    return getColor(level)
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
      <Text>{t("device.label", { count })}</Text>
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
        label: t("compliance.software.gold"),
        level: DeviceSoftwareLevel.GOLD,
        count: item.goldDeviceCount,
      },
      {
        label: t("compliance.software.silver"),
        level: DeviceSoftwareLevel.SILVER,
        count: item.silverDeviceCount,
      },
      {
        label: t("compliance.software.bronze"),
        level: DeviceSoftwareLevel.BRONZE,
        count: item.bronzeDeviceCount,
      },
      {
        label: t("compliance.nonCompliant"),
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

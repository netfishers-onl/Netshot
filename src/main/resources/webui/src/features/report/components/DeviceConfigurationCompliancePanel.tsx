import { DataTable, EntityLink } from "@/components"
import { LuChevronDown } from "react-icons/lu"
import { DeviceBadge, DeviceConfigComplianceBadge } from "@/features/device/components"
import { ConfigComplianceDeviceStatus } from "@/types"
import { useLocalization } from "@/i18n"
import { IconButton, Separator, Stack, Text } from "@chakra-ui/react"
import { createColumnHelper } from "@tanstack/react-table"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

export type DeviceConfigurationPanelProps = {
  name: string
  configs: ConfigComplianceDeviceStatus[]
}

const columnHelper = createColumnHelper<ConfigComplianceDeviceStatus>()

export default function DeviceConfigurationCompliancePanel(props: DeviceConfigurationPanelProps) {
  const { name, configs } = props
  const { t } = useTranslation()
  const { formatDateTime } = useLocalization()
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const columns = useMemo(
    () => [
      columnHelper.accessor("configCompliant", {
        cell: (info) => <DeviceConfigComplianceBadge compliant={info.getValue()} />,
        header: t("common.status"),
        enableSorting: true,
      }),
      columnHelper.accessor("policyName", {
        cell: (info) => (
          <EntityLink
            to={`/app/compliance/config/${info.row.original.policyId}`}
            textDecoration="none"
            _hover={{ color: "green.600" }}
          >
            {info.getValue()}
          </EntityLink>
        ),
        header: t("policy.label"),
        enableSorting: true,
      }),
      columnHelper.accessor("ruleName", {
        cell: (info) => (
          <EntityLink
            to={`/app/compliance/config/${info.row.original.policyId}/${info.row.original.ruleId}`}
            textDecoration="none"
            _hover={{ color: "green.600" }}
          >
            {info.getValue()}
          </EntityLink>
        ),
        header: t("policy.rule.label"),
        enableSorting: true,
      }),
      columnHelper.accessor("checkDate", {
        cell: (info) => <Text>{info.getValue() ? formatDateTime(info.getValue()) : t("common.nA")}</Text>,
        header: t("time.testDateTime"),
        enableSorting: true,
      }),
    ],
    [t, formatDateTime]
  )

  return (
    <Stack borderWidth="1px" borderColor="grey.100" borderRadius="2xl" bg="white" key={name} gap="0">
      <Stack
        direction="row"
        gap="3"
        alignItems="center"
        p="3"
        onClick={toggleExpand}
        cursor="pointer"
      >
        <IconButton
          size="sm"
          variant="ghost"
          colorPalette="green"
          aria-label={t("common.open")}
          css={{
            transform: isExpanded ? "" : "rotate(-90deg)",
          }}
        >
          <LuChevronDown />
        </IconButton>
        <DeviceBadge networkClass={configs?.[0]?.networkClass}>
          <Link
            to={`/app/devices/${configs?.[0]?.id}/compliance?open=config`}
            onClick={(e) => e.stopPropagation()}
          >
            {name}
          </Link>
        </DeviceBadge>
      </Stack>
      {isExpanded && (
        <>
          <Separator />
          <Stack direction="column" gap="3" pb="1">
            <DataTable columns={columns} data={configs} border="none" borderRadius="0" />
          </Stack>
        </>
      )}
    </Stack>
  )
}

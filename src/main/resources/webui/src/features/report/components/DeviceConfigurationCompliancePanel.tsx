import { DataTable } from "@/components"
import Icon from "@/components/Icon"
import { ConfigComplianceDeviceStatus } from "@/types"
import { formatDate } from "@/utils"
import { Button, IconButton, Separator, Spacer, Stack, Tag, Text } from "@chakra-ui/react"
import { createColumnHelper } from "@tanstack/react-table"
import { motion, useAnimationControls } from "framer-motion"
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
  const controls = useAnimationControls()
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true)

  const toggleCollapse = useCallback(async () => {
    setIsCollapsed((prev) => !prev)
    await controls.start(isCollapsed ? "show" : "hidden")
  }, [controls, isCollapsed])

  const columns = useMemo(
    () => [
      columnHelper.accessor("configCompliant", {
        cell: (info) => {
          const value = info.getValue()

          if (value) {
            return (
              <Tag.Root bg="green.50" color="green.900">
                {t("compliant")}
              </Tag.Root>
            )
          }

          return (
            <Tag.Root bg="green.900" color="green.50">
              {t("nonCompliant")}
            </Tag.Root>
          )
        },
        header: t("status"),
      }),
      columnHelper.accessor("policyName", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("policy"),
      }),
      columnHelper.accessor("ruleName", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("rule"),
      }),
      columnHelper.accessor("checkDate", {
        cell: (info) => <Text>{info.getValue() ? formatDate(info.getValue()) : t("nA")}</Text>,
        header: t("testDateTime"),
      }),
    ],
    [t]
  )

  return (
    <Stack borderWidth="1px" borderColor="grey.100" borderRadius="2xl" key={name} gap="0">
      <Stack
        direction="row"
        gap="3"
        alignItems="center"
        p="3"
        onClick={toggleCollapse}
        cursor="pointer"
      >
        <IconButton
          variant="ghost"
          colorPalette="green"
          aria-label={t("open")}
          css={{
            transform: isCollapsed ? "rotate(-90deg)" : "",
          }}
        >
          <Icon name="chevronDown" />
        </IconButton>
        <Text fontSize="md" fontWeight="semibold">
          {name}
        </Text>

        <Spacer />
        <Button colorPalette="green" variant="ghost" asChild>
          <Link to={`/app/devices/${configs?.[0]?.id}/compliance`}>{t("seeDetails")}</Link>
        </Button>
      </Stack>
      <motion.div
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0, height: 0, pointerEvents: "none" },
          show: {
            opacity: 1,
            height: "auto",
            pointerEvents: "all",
          },
        }}
        transition={{
          duration: 0.2,
        }}
      >
        <Separator />
        <Stack direction="column" gap="3" pb="1">
          <DataTable columns={columns} data={configs} border="none" borderRadius="0" />
        </Stack>
      </motion.div>
    </Stack>
  )
}

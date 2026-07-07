import { Accordion, Badge, Button, Heading, Icon, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useParams } from "react-router"

import api from "@/api"
import { AlertBox, DataTable, Protected } from "@/components"
import { LuCircleCheck, LuTrophy } from "react-icons/lu"
import {
  DeviceComplianceResult,
  DeviceSoftwareLevel,
  Level,
} from "@/types"
import { useLocalization } from "@/i18n"
import { useSoftwareLevels } from "@/hooks"

import { DeviceComplianceTag } from "../components/DeviceComplianceTag"
import DeviceSoftwareLevelBadge from "../components/DeviceSoftwareLevelBadge"
import DeviceConfigComplianceBadge from "../components/DeviceConfigComplianceBadge"
import DeviceHardwareComplianceBadge from "../components/DeviceHardwareComplianceBadge"
import DeviceComplianceTrigger from "../components/DeviceComplianceTrigger"
import { QUERIES } from "../constants"
import { useDevice } from "../contexts/device"

const columnHelper = createColumnHelper<DeviceComplianceResult>()

function SoftwareLevelTag({ colorPalette, children }: { colorPalette?: string; children?: React.ReactNode }) {
  return (
    <Badge as="span" variant="surface" colorPalette={colorPalette} display="inline-flex" alignItems="center" gap="1" mx="1">
      <Icon size="xs" flexShrink={0}><LuTrophy /></Icon>
      {children}
    </Badge>
  )
}

export default function DeviceComplianceScreen() {
  const { t } = useTranslation()
  const { formatDate, formatDateTime } = useLocalization()
  const { device } = useDevice()
  const params = useParams<{ id: string }>()
  const { getColor: getLevelColor } = useSoftwareLevels()

  const { data = [], isPending } = useQuery({
    queryKey: [QUERIES.DEVICE_COMPLIANCE, params?.id],
    queryFn: async () => api.device.getComplianceResultById(+params?.id),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor("policyName", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("policy.label"),
        enableSorting: true,
      }),
      columnHelper.accessor("ruleName", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("policy.rule.label"),
        enableSorting: true,
      }),
      columnHelper.accessor("result", {
        cell: (info) => <DeviceComplianceTag resultType={info.getValue()} />,
        header: t("common.result"),
        enableSorting: true,
      }),
      columnHelper.accessor("comment", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("common.details"),
        enableSorting: true,
      }),
      columnHelper.accessor("checkDate", {
        cell: (info) => <Text>{info.getValue() ? formatDateTime(info.getValue()) : t("common.nA")}</Text>,
        header: t("compliance.lastCheck"),
        enableSorting: true,
      }),
    ],
    [t]
  )

  const softwareLevelColor = useMemo(() => {
    return getLevelColor(device?.softwareLevel)
  }, [device?.softwareLevel])

  return (
    <Stack gap="6" flex="1">
      <Accordion.Root multiple>
        <Accordion.Item value="software">
          <Accordion.ItemTrigger cursor="pointer">
            <Accordion.ItemIndicator rotate="-90deg" _open={{ rotate: "0deg" }} />
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap="12" flex="1">
              <Heading size="md">{t("common.software")}</Heading>
              {device?.softwareLevel && <DeviceSoftwareLevelBadge level={device.softwareLevel} />}
            </Stack>
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Stack gap="4" p="4">
              <AlertBox
                type={device?.softwareLevel === DeviceSoftwareLevel.UNKNOWN ? "error" : "success"}
              >
                {device?.softwareLevel === DeviceSoftwareLevel.UNKNOWN ? (
                  <Text>
                    {t("compliance.software.versionDoesNotConform", {
                      version: device?.softwareVersion || t("common.nA"),
                    })}
                  </Text>
                ) : (
                  <Text>
                    <Trans
                      t={t}
                      i18nKey="compliance.software.conformanceLevel"
                      values={{ level: device?.softwareLevel }}
                      components={{ tag: <SoftwareLevelTag colorPalette={softwareLevelColor} /> }}
                    />
                  </Text>
                )}
              </AlertBox>
            </Stack>
          </Accordion.ItemContent>
        </Accordion.Item>

        <Accordion.Item value="hardware">
          <Accordion.ItemTrigger cursor="pointer">
            <Accordion.ItemIndicator rotate="-90deg" _open={{ rotate: "0deg" }} />
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap="12" flex="1">
              <Heading size="md">{t("common.hardware")}</Heading>
              {device && (
                <DeviceHardwareComplianceBadge eol={device.endOfLife} eos={device.endOfSale} />
              )}
            </Stack>
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Stack gap="3" direction="row" p="4">
              <AlertBox type={device?.endOfSale ? "warning" : "success"}>
                {device?.endOfSale ? (
                  <Text>
                    {t("compliance.hardware.endOfSaleSince", {
                      date: formatDate(device?.eosDate),
                      module: device?.eosModule?.partNumber,
                    })}
                  </Text>
                ) : (
                  <Text>
                    {device?.eosDate
                      ? t("compliance.hardware.notEndOfSaleYetPlanned", {
                          date: formatDate(device?.eosDate),
                          module: device?.eosModule?.partNumber,
                        })
                      : t("compliance.hardware.notEndOfSaleYet")}
                  </Text>
                )}
              </AlertBox>
              <AlertBox type={device?.endOfLife ? "warning" : "success"}>
                {device?.endOfLife ? (
                  <Text>
                    {t("compliance.hardware.endOfLifeSince", {
                      date: formatDate(device?.eolDate),
                      module: device?.eolModule?.partNumber,
                    })}
                  </Text>
                ) : (
                  <Text>
                    {device?.eolDate
                      ? t("compliance.hardware.notEndOfLifeYetPlanned", {
                          date: formatDate(device?.eolDate),
                          module: device?.eolModule?.partNumber,
                        })
                      : t("compliance.hardware.notEndOfLifeYet")}
                  </Text>
                )}
              </AlertBox>
            </Stack>
          </Accordion.ItemContent>
        </Accordion.Item>

        <Accordion.Item value="config">
          <Accordion.ItemTrigger cursor="pointer">
            <Accordion.ItemIndicator rotate="-90deg" _open={{ rotate: "0deg" }} />
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap="12" flex="1">
              <Heading size="md">{t("device.config.label")}</Heading>
              {device && <DeviceConfigComplianceBadge compliant={!!device.compliant} />}
            </Stack>
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Stack gap="4" p="4">
              {data?.length > 0 ? (
                <>
                  <AlertBox type={device?.compliant ? "success" : "error"}>
                    {device?.compliant ? (
                      <Text>{t("compliance.deviceCompliantWithAll")}</Text>
                    ) : (
                      <Text>{t("compliance.deviceNotCompliantWithSome")}</Text>
                    )}
                  </AlertBox>
                  <DataTable columns={columns} data={data} loading={isPending} />
                </>
              ) : (
                <Text>{t("compliance.noResultForDevice")}</Text>
              )}
            </Stack>
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>

      <Protected minLevel={Level.Operator}>
        <DeviceComplianceTrigger devices={[device]}>
          <Button alignSelf="start" variant="outline">
            <LuCircleCheck />
            {t("compliance.check")}
          </Button>
        </DeviceComplianceTrigger>
      </Protected>
    </Stack>
  )
}

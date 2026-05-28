import { Button, Heading, Stack, Tag, Text } from "@chakra-ui/react"
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
  DeviceComplianceResultType,
  DeviceSoftwareLevel,
  Level,
} from "@/types"
import { useLocalization } from "@/i18n"
import { useSoftwareLevels } from "@/hooks"

import DeviceComplianceButton from "../components/DeviceComplianceButton"
import { QUERIES } from "../constants"
import { useDevice } from "../contexts/device"

const columnHelper = createColumnHelper<DeviceComplianceResult>()

function SoftwareLevelTag({ colorPalette, children }: { colorPalette?: string; children?: React.ReactNode }) {
  return (
    <Tag.Root as="span" colorPalette={colorPalette} ml={2} mr={2}>
      <LuTrophy size={12} />
      {children}
    </Tag.Root>
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
        cell: (info) => {
          const value = info.getValue()
          return (
            <>
              {value === DeviceComplianceResultType.Conforming && (
                <Tag.Root>{t("compliance.compliant")}</Tag.Root>
              )}
              {value === DeviceComplianceResultType.NonConfirming && (
                <Tag.Root colorPalette="red">{t("compliance.nonCompliant")}</Tag.Root>
              )}
              {value === DeviceComplianceResultType.Disabled && (
                <Tag.Root colorPalette="grey">{t("common.disabled")}</Tag.Root>
              )}
            </>
          )
        },
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
      <Stack gap="12">
        <Stack gap="4">
          <Heading size="md">{t("common.software")}</Heading>
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
        <Stack gap="4">
          <Heading size="md">{t("common.hardware")}</Heading>
          <Stack gap="3" direction="row">
            <AlertBox type={device?.endOfSale ? "warning" : "success"}>
              {device?.endOfSale ? (
                <Text>
                  {t("compliance.hardware.endOfSaleSince", {
                    date: formatDate(device?.eosDate, { dateStyle: "long" }),
                    module: device?.eosModule?.partNumber,
                  })}
                </Text>
              ) : (
                <Text>
                  {device?.eosDate
                    ? t("compliance.hardware.notEndOfSaleYetPlanned", {
                        date: formatDate(device?.eosDate, { dateStyle: "long" }),
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
                    date: formatDate(device?.eolDate, { dateStyle: "long" }),
                    module: device?.eolModule?.partNumber,
                  })}
                </Text>
              ) : (
                <Text>
                  {device?.eolDate
                    ? t("compliance.hardware.notEndOfLifeYetPlanned", {
                        date: formatDate(device?.eolDate, { dateStyle: "long" }),
                        module: device?.eolModule?.partNumber,
                      })
                    : t("compliance.hardware.notEndOfLifeYet")}
                </Text>
              )}
            </AlertBox>
          </Stack>
        </Stack>
        <Stack gap="4">
          <Heading size="md">{t("device.config.label")}</Heading>
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
        <Protected minLevel={Level.Operator}>
          <DeviceComplianceButton
            devices={[device]}
            renderItem={(open) => (
              <Button alignSelf="start" variant="primary" onClick={open}>
                <LuCircleCheck />
                {t("compliance.check")}
              </Button>
            )}
          />
        </Protected>
      </Stack>
    </Stack>
  )
}

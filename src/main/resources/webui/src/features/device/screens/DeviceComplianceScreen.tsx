import { Button, Heading, Stack, Tag, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useParams } from "react-router"

import api from "@/api"
import { AlertBox, DataTable, Protected } from "@/components"
import Icon from "@/components/Icon"
import {
  DeviceComplianceResult,
  DeviceComplianceResultType,
  DeviceSoftwareLevel,
  Level,
} from "@/types"
import { formatDate, getSoftwareLevelColor } from "@/utils"

import DeviceComplianceButton from "../components/DeviceComplianceButton"
import { QUERIES } from "../constants"
import { useDevice } from "../contexts/device"

const columnHelper = createColumnHelper<DeviceComplianceResult>()

export default function DeviceComplianceScreen() {
  const { t } = useTranslation()
  const { device } = useDevice()
  const params = useParams<{ id: string }>()

  const { data = [], isPending } = useQuery({
    queryKey: [QUERIES.DEVICE_COMPLIANCE, params?.id],
    queryFn: async () => api.device.getComplianceResultById(+params?.id),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor("policyName", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("policy"),
        enableSorting: true,
      }),
      columnHelper.accessor("ruleName", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("rule"),
        enableSorting: true,
      }),
      columnHelper.accessor("result", {
        cell: (info) => {
          const value = info.getValue()
          return (
            <>
              {value === DeviceComplianceResultType.Conforming && (
                <Tag.Root>{t("compliant")}</Tag.Root>
              )}
              {value === DeviceComplianceResultType.NonConfirming && (
                <Tag.Root colorPalette="red">{t("nonCompliant2")}</Tag.Root>
              )}
              {value === DeviceComplianceResultType.Disabled && (
                <Tag.Root colorPalette="grey">{t("disabled")}</Tag.Root>
              )}
            </>
          )
        },
        header: t("result"),
        enableSorting: true,
      }),
      columnHelper.accessor("comment", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("details"),
        enableSorting: true,
      }),
      columnHelper.accessor("checkDate", {
        cell: (info) => <Text>{info.getValue() ? formatDate(info.getValue()) : t("nA")}</Text>,
        header: t("lastCheck"),
        enableSorting: true,
      }),
    ],
    [t]
  )

  const softwareLevelColor = useMemo(() => {
    return getSoftwareLevelColor(device?.softwareLevel)
  }, [device?.softwareLevel])

  return (
    <Stack gap="6" flex="1">
      <Stack gap="12">
        <Stack gap="4">
          <Heading size="md">{t("software")}</Heading>
          <AlertBox
            type={device?.softwareLevel === DeviceSoftwareLevel.UNKNOWN ? "error" : "success"}
          >
            {device?.softwareLevel === DeviceSoftwareLevel.UNKNOWN ? (
              <Text>
                {t("theSoftwareVersionDoesNotConformToTheSoftwareRules", {
                  version: device?.softwareVersion || t("nA"),
                })}
              </Text>
            ) : (
              <Text>
                <Trans
                  t={t}
                  i18nKey="theConformanceLevelOfTheSoftwareVersionForThisDeviceIs"
                  values={{ level: device?.softwareLevel }}
                  components={{ tag: <Tag.Root as="span" colorPalette={softwareLevelColor} /> }}
                />
              </Text>
            )}
          </AlertBox>
        </Stack>
        <Stack gap="4">
          <Heading size="md">{t("hardware")}</Heading>
          <Stack gap="3" direction="row">
            <AlertBox type={device?.endOfSale ? "warning" : "success"}>
              {device?.endOfSale ? (
                <Text>
                  {t("endOfSaleSinceModule", {
                    date: formatDate(device?.eosDate, "PPP"),
                    module: device?.eosModule?.partNumber,
                  })}
                </Text>
              ) : (
                <Text>
                  {device?.eosDate
                    ? t("notEndOfSaleYetPlannedOnModule", {
                        date: formatDate(device?.eosDate, "PPP"),
                        module: device?.eosModule?.partNumber,
                      })
                    : t("notEndOfSaleYet")}
                </Text>
              )}
            </AlertBox>
            <AlertBox type={device?.endOfLife ? "warning" : "success"}>
              {device?.endOfLife ? (
                <Text>
                  {t("endOfLifeSinceModule", {
                    date: formatDate(device?.eolDate, "PPP"),
                    module: device?.eolModule?.partNumber,
                  })}
                </Text>
              ) : (
                <Text>
                  {device?.eolDate
                    ? t("notEndOfLifeYetPlannedOnModule", {
                        date: formatDate(device?.eolDate, "PPP"),
                        module: device?.eolModule?.partNumber,
                      })
                    : t("notEndOfLifeYet")}
                </Text>
              )}
            </AlertBox>
          </Stack>
        </Stack>
        <Stack gap="4">
          <Heading size="md">{t("configuration")}</Heading>
          {data?.length > 0 ? (
            <>
              <AlertBox type={device?.compliant ? "success" : "error"}>
                {device?.compliant ? (
                  <Text>{t("theDeviceIsCompliantWithAllPolicies")}</Text>
                ) : (
                  <Text>{t("theDeviceIsNotInComplianceWithSomePolicies")}</Text>
                )}
              </AlertBox>
              <DataTable columns={columns} data={data} loading={isPending} />
            </>
          ) : (
            <Text>{t("thereIsNoComplianceResultForThisDevice")}</Text>
          )}
        </Stack>
        <Protected minLevel={Level.Operator}>
          <DeviceComplianceButton
            devices={[device]}
            renderItem={(open) => (
              <Button alignSelf="start" variant="primary" onClick={open}>
                <Icon name="checkCircle" />
                {t("checkCompliance")}
              </Button>
            )}
          />
        </Protected>
      </Stack>
    </Stack>
  )
}

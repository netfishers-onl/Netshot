import { Chart } from "@/components"
import { useAlertDialog } from "@/dialog"
import { GroupSoftwareComplianceStat } from "@/types"
import {
  Box,
  Dialog,
  GridItem,
  GridItemProps,
  Heading,
  Separator,
  Spacer,
  Stack,
  Tag,
  Text,
  useToken,
} from "@chakra-ui/react"
import { ChartConfiguration } from "chart.js/auto"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import SoftwareComplianceDialog from "./SoftwareComplianceDialog"

export type SoftwareComplianceItemProps = {
  item: GroupSoftwareComplianceStat
} & GridItemProps

export default function SoftwareComplianceItem(props: SoftwareComplianceItemProps) {
  const { item, ...other } = props
  const { t } = useTranslation()
  const dialog = useAlertDialog()
  const [gold] = useToken("colors", "yellow.500")
  const [silver] = useToken("colors", "grey.200")
  const [bronze] = useToken("colors", "bronze.500")
  const [nonCompliant] = useToken("colors", "grey.900")

  const nonCompliantDeviceCount = useMemo(
    () => item.deviceCount - item.goldDeviceCount - item.silverDeviceCount - item.bronzeDeviceCount,
    [item.goldDeviceCount, item.silverDeviceCount, item.bronzeDeviceCount, item.deviceCount]
  )

  const config = useMemo(() => {
    const labels = [t("Gold"), t("Silver"), t("Bronze"), t("Non compliant")]
    const data = [
      item.goldDeviceCount,
      item.silverDeviceCount,
      item.bronzeDeviceCount,
      nonCompliantDeviceCount,
    ]

    return {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: [gold, silver, bronze, nonCompliant],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: "70%",
        scales: {
          x: {
            display: false,
          },
          y: {
            display: false,
          },
        },
      },
    } as ChartConfiguration<"doughnut">
  }, [t, item, nonCompliantDeviceCount, gold, silver, bronze, nonCompliant])

  const openDetail = useCallback(() => {
    dialog.open({
      title: (
        <Dialog.Header as={Stack} display="flex" direction="row" alignItems="center" gap="4">
          <Heading as="h3" fontSize="2xl" fontWeight="semibold">
            {t("Software compliance")}
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
  }, [dialog])

  return (
    <GridItem w="100%" {...other}>
      <Stack gap="6" p="6" bg="white" border="1px solid" borderColor="grey.100" borderRadius="3xl">
        <Stack direction="row" alignItems="center">
          <Text fontWeight="semibold">{item.groupName}</Text>
        </Stack>
        <Chart w="100%" config={config} />
        <Stack gap="2" onClick={openDetail} cursor="pointer">
          <Stack direction="row" alignItems="center" gap="3">
            <Box w="14px" h="14px" borderRadius="4px" bg={gold} />
            <Text>{t("Gold")}</Text>
            <Spacer />
            <Text>{item.goldDeviceCount}</Text>
          </Stack>
          <Separator />
          <Stack direction="row" alignItems="center" gap="3">
            <Box w="14px" h="14px" borderRadius="4px" bg={silver} />
            <Text>{t("Silver")}</Text>
            <Spacer />
            <Text>{item.silverDeviceCount}</Text>
          </Stack>
          <Separator />
          <Stack direction="row" alignItems="center" gap="3">
            <Box w="14px" h="14px" borderRadius="4px" bg={bronze} />
            <Text>{t("Bronze")}</Text>
            <Spacer />
            <Text>{item.bronzeDeviceCount}</Text>
          </Stack>
          <Separator />
          <Stack direction="row" alignItems="center" gap="3">
            <Box w="14px" h="14px" borderRadius="4px" bg={nonCompliant} />
            <Text>{t("Non compliant")}</Text>
            <Spacer />
            <Text>{nonCompliantDeviceCount}</Text>
          </Stack>
        </Stack>
      </Stack>
    </GridItem>
  )
}

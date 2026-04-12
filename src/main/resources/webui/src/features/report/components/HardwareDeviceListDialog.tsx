import api from "@/api"
import { EmptyResult, EntityLink, VirtualizedDataTable } from "@/components"
import { useDialogConfig } from "@/dialog"
import { HardwareSupportDevice } from "@/types"
import { useI18nUtil } from "@/i18n"
import { CloseButton, Dialog, Heading, Portal, Skeleton, Stack, Tag, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

export type HardwareDeviceListButtonProps = {
  type: "eos" | "eol"
  date: number
}

const columnHelper = createColumnHelper<HardwareSupportDevice>()

export default function HardwareDeviceListDialog(props: HardwareDeviceListButtonProps) {
  const { type, date } = props
  const { t } = useTranslation()
  const { formatDate } = useI18nUtil()
  const dialogConfig = useDialogConfig()
  const formattedDate = formatDate(date, { dateStyle: "medium" })

  const { data, isPending } = useQuery({
    queryKey: [QUERIES.DEVICE_HARDWARE_STATUS, type, date],
    queryFn() {
      return api.report.getAllHardwareSupportDevices(type, date)
    },
  })

  const columns = [
    columnHelper.accessor("name", {
      cell: (info) => (
        <EntityLink
          to={`/app/devices/${info.row.original.id}/general`}
          onClick={() => dialogConfig.close()}
        >
          {info.getValue()}
        </EntityLink>
      ),
      header: t("device"),
    }),
    columnHelper.accessor("mgmtAddress", {
      cell: (info) => <Text>{info.getValue()}</Text>,
      header: t("managementIp"),
    }),
    columnHelper.accessor("family", {
      cell: (info) => <Text>{info.getValue()}</Text>,
      header: t("family"),
    }),
  ]

  const title = type === "eol" ? "End of life devices" : "End of sale devices"

  return (
    <Dialog.Root
      scrollBehavior="inside"
      size="xl"
      open={dialogConfig.props.isOpen}
      onOpenChange={(e) => {
        if (!e.open) {
          dialogConfig.close()
        }
      }}
      onExitComplete={() => {
        dialogConfig.remove()
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content height="90vh">
            <Dialog.Header display="flex" alignItems="center" gap="4">
              <Heading as="h3" fontSize="2xl" fontWeight="semibold">
                {t(title)}
              </Heading>
              <Tag.Root colorPalette="grey">{formattedDate}</Tag.Root>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body overflowY="auto" display="flex" flexDirection="column" flex="1" pb="7">
              {isPending ? (
                <Stack gap="3">
                  <Skeleton h="60px" />
                  <Skeleton h="60px" />
                  <Skeleton h="60px" />
                  <Skeleton h="60px" />
                </Stack>
              ) : (
                <>
                  {data?.length > 0 ? (
                    <VirtualizedDataTable data={data} columns={columns} />
                  ) : (
                    <EmptyResult
                      title={t("noDevice")}
                      description={t("thereIsNoDeviceWithEndOfLifeStatusAtThisDate")}
                    />
                  )}
                </>
              )}
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" variant="outline" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

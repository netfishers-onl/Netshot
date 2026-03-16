import api, { ReportExportDataQueryParams } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { DomainSelect, Switch, TreeGroupSelector } from "@/components"
import { Select } from "@/components/Select"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { PropsWithRenderItem } from "@/types"
import { download } from "@/utils"
import { Separator, Stack, Text } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useExportMimesTypesOptions } from "../hooks"
import { ExportMimeType } from "../types"

type Form = {
  format: ExportMimeType
  domain: number
  groups: number[]
  hasGroups: boolean
  hasInterfaces: boolean
  hasInventory: boolean
  hasInventoryHistory: boolean
  hasLocations: boolean
  hasCompliance: boolean
  hasDeviceDriverAttributes: boolean
}

function ExportDataForm() {
  const { t } = useTranslation()
  const form = useFormContext()
  const exportMimesTypesOptions = useExportMimesTypesOptions()

  const hasInventory = useWatch({
    control: form.control,
    name: "hasInventory",
  })

  const groups = useWatch({
    control: form.control,
    name: "groups",
  })

  useEffect(() => {
    if (!hasInventory) {
      form.setValue("hasInventoryHistory", false)
    }
  }, [form, hasInventory])

  return (
    <Stack gap="6">
      <Select
        required
        options={exportMimesTypesOptions.options}
        control={form.control}
        name="format"
        label={t("Output format")}
        placeholder={t("Select an output format")}
      />
      <DomainSelect control={form.control} name="domain" />
      <TreeGroupSelector
        value={groups}
        onChange={(groups) => form.setValue("groups", groups)}
        isMulti
        withAny
      />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("Device group details")}</Text>
          <Text color="grey.400">{t("Export device group information")}</Text>
        </Stack>
        <Switch w="initial" control={form.control} name="hasGroups" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("Driver specific device attributes")}</Text>
          <Text color="grey.400">{t("Export attributes of driver device")}</Text>
        </Stack>
        <Switch w="initial" control={form.control} name="hasDeviceDriverAttributes" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("Interfaces")}</Text>
          <Text color="grey.400">
            {t("Export device interfaces (including MAC and IP addresses)")}
          </Text>
        </Stack>
        <Switch w="initial" control={form.control} name="hasInterfaces" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("Inventory")}</Text>
          <Text color="grey.400">
            {t("Export inventory (modules, with part and serial numbers) ")}
          </Text>
        </Stack>
        <Switch w="initial" control={form.control} name="hasInventory" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("Module history")}</Text>
          <Text color="grey.400">{t("Export the device module history")}</Text>
        </Stack>
        <Switch
          w="initial"
          control={form.control}
          name="hasInventoryHistory"
          disabled={!hasInventory}
        />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("Locations and contacts")}</Text>
          <Text color="grey.400">{t("Export device locations and contacts information")}</Text>
        </Stack>
        <Switch w="initial" control={form.control} name="hasLocations" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("Compliance information")}</Text>
          <Text color="grey.400">{t("Export compliance report and information")}</Text>
        </Stack>
        <Switch w="initial" control={form.control} name="hasCompliance" />
      </Stack>
    </Stack>
  )
}

export type ExportDataButtonProps = PropsWithRenderItem

export default function ExportDataButton(props: ExportDataButtonProps) {
  const { renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const exportMimesTypesOptions = useExportMimesTypesOptions()
  const dialog = useFormDialogWithMutation()

  const form = useForm<Form>({
    mode: "onChange",
    defaultValues: {
      format: exportMimesTypesOptions.getFirst().value,
      domain: null,
      groups: [],
      hasGroups: false,
      hasInterfaces: false,
      hasInventory: false,
      hasInventoryHistory: false,
      hasLocations: false,
      hasCompliance: false,
      hasDeviceDriverAttributes: false,
    },
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.EXPORT_DATA,
    mutationFn: async (queryParams: ReportExportDataQueryParams) =>
      api.report.exportData(queryParams),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.EXPORT_DATA, {
      title: t("Export data"),
      description: <ExportDataForm />,
      form,
      size: "lg",
      async onSubmit(values: Form) {
        const res = await mutation.mutateAsync({
          format: values.format,
          domain: values.domain,
          group: values.groups,
          groups: values.hasGroups,
          interfaces: values.hasInterfaces,
          inventory: values.hasInventory,
          inventoryhistory: values.hasInventoryHistory,
          locations: values.hasLocations,
          compliance: values.hasCompliance,
          devicedriverattributes: values.hasDeviceDriverAttributes,
        })

        dialogRef.close()
        download(res.blob, res.filename)
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("Export"),
      },
    })
  }

  return renderItem(open)
}

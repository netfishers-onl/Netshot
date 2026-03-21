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
        label={t("outputFormat")}
        placeholder={t("selectAnOutputFormat")}
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
          <Text fontWeight="medium">{t("deviceGroupDetails")}</Text>
          <Text color="grey.400">{t("exportDeviceGroupInformation")}</Text>
        </Stack>
        <Switch w="initial" control={form.control} name="hasGroups" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("driverSpecificDeviceAttributes")}</Text>
          <Text color="grey.400">{t("exportAttributesOfDriverDevice")}</Text>
        </Stack>
        <Switch w="initial" control={form.control} name="hasDeviceDriverAttributes" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("interfaces")}</Text>
          <Text color="grey.400">
            {t("exportDeviceInterfacesIncludingMacAndIpAddresses")}
          </Text>
        </Stack>
        <Switch w="initial" control={form.control} name="hasInterfaces" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("inventory")}</Text>
          <Text color="grey.400">
            {t("exportInventoryModulesWithPartAndSerialNumbers")}
          </Text>
        </Stack>
        <Switch w="initial" control={form.control} name="hasInventory" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("moduleHistory")}</Text>
          <Text color="grey.400">{t("exportTheDeviceModuleHistory")}</Text>
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
          <Text fontWeight="medium">{t("locationsAndContacts")}</Text>
          <Text color="grey.400">{t("exportDeviceLocationsAndContactsInformation")}</Text>
        </Stack>
        <Switch w="initial" control={form.control} name="hasLocations" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("complianceInformation")}</Text>
          <Text color="grey.400">{t("exportComplianceReportAndInformation")}</Text>
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
      title: t("exportData"),
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
        label: t("export"),
      },
    })
  }

  return renderItem(open)
}

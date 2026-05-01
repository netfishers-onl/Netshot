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
  domain: string
  groups: number[]
  withGroups: boolean
  withInterfaces: boolean
  withInventory: boolean
  withInventoryHistory: boolean
  withLocations: boolean
  withCompliance: boolean
  withDeviceDriverAttributes: boolean
}

function ExportDataForm() {
  const { t } = useTranslation()
  const form = useFormContext()
  const exportMimesTypesOptions = useExportMimesTypesOptions()

  const withInventory = useWatch({
    control: form.control,
    name: "withInventory",
  })

  const groups = useWatch({
    control: form.control,
    name: "groups",
  })

  useEffect(() => {
    if (!withInventory) {
      form.setValue("withInventoryHistory", false)
    }
  }, [form, withInventory])

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
      <DomainSelect control={form.control} name="domain" withAny />
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
        <Switch w="initial" control={form.control} name="withGroups" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("driverSpecificDeviceAttributes")}</Text>
          <Text color="grey.400">{t("exportAttributesOfDriverDevice")}</Text>
        </Stack>
        <Switch w="initial" control={form.control} name="withDeviceDriverAttributes" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("interfaces")}</Text>
          <Text color="grey.400">
            {t("exportDeviceInterfacesIncludingMacAndIpAddresses")}
          </Text>
        </Stack>
        <Switch w="initial" control={form.control} name="withInterfaces" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("inventory")}</Text>
          <Text color="grey.400">
            {t("exportInventoryModulesWithPartAndSerialNumbers")}
          </Text>
        </Stack>
        <Switch w="initial" control={form.control} name="withInventory" />
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
          name="withInventoryHistory"
          disabled={!withInventory}
        />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("locationsAndContacts")}</Text>
          <Text color="grey.400">{t("exportDeviceLocationsAndContactsInformation")}</Text>
        </Stack>
        <Switch w="initial" control={form.control} name="withLocations" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("complianceInformation")}</Text>
          <Text color="grey.400">{t("exportComplianceReportAndInformation")}</Text>
        </Stack>
        <Switch w="initial" control={form.control} name="withCompliance" />
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
      domain: "",
      groups: [],
      withGroups: false,
      withInterfaces: false,
      withInventory: false,
      withInventoryHistory: false,
      withLocations: false,
      withCompliance: false,
      withDeviceDriverAttributes: false,
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
        const params: ReportExportDataQueryParams = {};
        if (values.domain) {
          Object.assign(params, {
            domain: [+values.domain],
          });
        }
        if (values.groups?.length) {
          Object.assign(params, {
            group: values.groups,
          });
        }
        if (values.withGroups) {
          Object.assign(params, {
            groups: true,
          });
        }
        if (values.withInterfaces) {
          Object.assign(params, {
            interfaces: true,
          });
        }
        if (values.withInventory) {
          Object.assign(params, {
            inventory: true,
          });
        }
        if (values.withInventoryHistory) {
          Object.assign(params, {
            inventoryhistory: true,
          });
        }
        if (values.withLocations) {
          Object.assign(params, {
            locations: true,
          });
        }
        if (values.withCompliance) {
          Object.assign(params, {
            compliance: true,
          });
        }
        if (values.withDeviceDriverAttributes) {
          Object.assign(params, {
            devicedriverattributes: true,
          });
        }
        const res = await mutation.mutateAsync(params)

        dialogRef.close()
        form.reset()
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

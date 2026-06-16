import api, { ReportExportDataQueryParams } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { DomainSelect, Switch, TreeGroupSelector } from "@/components"
import { Select } from "@/components/Select"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { download } from "@/utils"
import { Separator, Stack, Text } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"
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
        label={t("common.outputFormat")}
        placeholder={t("common.selectOutputFormat")}
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
          <Text fontWeight="medium">{t("group.details")}</Text>
          <Text color="grey.400">{t("group.exportInfo")}</Text>
        </Stack>
        <Switch w="initial" control={form.control} name="withGroups" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("device.driverSpecificAttributes")}</Text>
          <Text color="grey.400">{t("report.exportDriverAttributes")}</Text>
        </Stack>
        <Switch w="initial" control={form.control} name="withDeviceDriverAttributes" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("device.interface.list")}</Text>
          <Text color="grey.400">
            {t("device.interface.export")}
          </Text>
        </Stack>
        <Switch w="initial" control={form.control} name="withInterfaces" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("common.inventory")}</Text>
          <Text color="grey.400">
            {t("device.module.export")}
          </Text>
        </Stack>
        <Switch w="initial" control={form.control} name="withInventory" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("device.module.history")}</Text>
          <Text color="grey.400">{t("device.module.exportHistory")}</Text>
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
          <Text fontWeight="medium">{t("common.locationsAndContacts")}</Text>
          <Text color="grey.400">{t("report.exportLocationsAndContacts")}</Text>
        </Stack>
        <Switch w="initial" control={form.control} name="withLocations" />
      </Stack>
      <Separator />
      <Stack direction="row" gap="6" alignItems="start">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("compliance.information")}</Text>
          <Text color="grey.400">{t("report.exportCompliance")}</Text>
        </Stack>
        <Switch w="initial" control={form.control} name="withCompliance" />
      </Stack>
    </Stack>
  )
}

export type ExportDataTriggerProps = { children: React.ReactElement<any> } & Record<string, unknown>

export default function ExportDataTrigger({ children, ...rest }: ExportDataTriggerProps) {
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
      title: t("common.exportData"),
      description: <ExportDataForm />,
      form,
      size: "lg",
      async onSubmit(values: Form) {
        const params: ReportExportDataQueryParams = {};
        if (values.domain) {
          Object.assign(params, { domain: [+values.domain] });
        }
        if (values.groups?.length) {
          Object.assign(params, { group: values.groups });
        }
        if (values.withGroups) {
          Object.assign(params, { groups: true });
        }
        if (values.withInterfaces) {
          Object.assign(params, { interfaces: true });
        }
        if (values.withInventory) {
          Object.assign(params, { inventory: true });
        }
        if (values.withInventoryHistory) {
          Object.assign(params, { inventoryhistory: true });
        }
        if (values.withLocations) {
          Object.assign(params, { locations: true });
        }
        if (values.withCompliance) {
          Object.assign(params, { compliance: true });
        }
        if (values.withDeviceDriverAttributes) {
          Object.assign(params, { devicedriverattributes: true });
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
        label: t("common.export"),
      },
    })
  }

  return React.cloneElement(children, { onClick: open, onSelect: open, ...rest })
}

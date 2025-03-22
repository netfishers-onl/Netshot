import api, { ReportExportDataQueryParams } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DomainSelect, Select, Switch, TreeGroupSelector } from "@/components";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Group, Option } from "@/types";
import { download } from "@/utils";
import { Divider, Stack, Text } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback, useEffect } from "react";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { EXPORT_MIMES_TYPES_OPTIONS } from "../constants";
import { ExportMimeType } from "../types";

type Form = {
  format: Option<ExportMimeType>;
  domain: Option<number>;
  groups: Group[];
  hasGroups: boolean;
  hasInterfaces: boolean;
  hasInventory: boolean;
  hasInventoryHistory: boolean;
  hasLocations: boolean;
  hasCompliance: boolean;
  hasDeviceDriverAttributes: boolean;
};

function ExportDataForm() {
  const { t } = useTranslation();
  const form = useFormContext();
  const hasInventory = useWatch({
    control: form.control,
    name: "hasInventory",
  });

  const groups = useWatch({
    control: form.control,
    name: "groups",
  });

  useEffect(() => {
    if (!hasInventory) {
      form.setValue("hasInventoryHistory", false);
    }
  }, [form, hasInventory]);

  return (
    <Stack spacing="6">
      <Select
        isRequired
        options={EXPORT_MIMES_TYPES_OPTIONS}
        control={form.control}
        name="format"
        label={t("Output format")}
      />
      <DomainSelect control={form.control} name="domain" />
      <TreeGroupSelector
        value={groups}
        onChange={(groups) => form.setValue("groups", groups)}
        isMulti
        withAny
      />
      <Stack direction="row" spacing="6">
        <Stack spacing="0" flex="1">
          <Text fontWeight="medium">{t("Device group details")}</Text>
          <Text color="grey.400">{t("Export device group informations")}</Text>
        </Stack>
        <Switch w="initial" control={form.control} name="hasGroups" />
      </Stack>
      <Divider />
      <Stack direction="row" spacing="6">
        <Stack spacing="0" flex="1">
          <Text fontWeight="medium">
            {t("Driver specific device attributes")}
          </Text>
          <Text color="grey.400">
            {t("Export attributes of driver device")}
          </Text>
        </Stack>
        <Switch
          w="initial"
          control={form.control}
          name="hasDeviceDriverAttributes"
        />
      </Stack>
      <Divider />
      <Stack direction="row" spacing="6">
        <Stack spacing="0" flex="1">
          <Text fontWeight="medium">{t("Interfaces")}</Text>
          <Text color="grey.400">
            {t("Export device interfaces (including MAC and IP addresses)")}
          </Text>
        </Stack>
        <Switch w="initial" control={form.control} name="hasInterfaces" />
      </Stack>
      <Divider />
      <Stack direction="row" spacing="6">
        <Stack spacing="0" flex="1">
          <Text fontWeight="medium">{t("Inventory")}</Text>
          <Text color="grey.400">
            {t("Export inventory (modules, with part and serial numbers) ")}
          </Text>
        </Stack>
        <Switch w="initial" control={form.control} name="hasInventory" />
      </Stack>
      <Divider />
      <Stack direction="row" spacing="6">
        <Stack spacing="0" flex="1">
          <Text fontWeight="medium">{t("Module history")}</Text>
          <Text color="grey.400">{t("Export the device module history")}</Text>
        </Stack>
        <Switch
          w="initial"
          control={form.control}
          name="hasInventoryHistory"
          isDisabled={!hasInventory}
        />
      </Stack>
      <Divider />
      <Stack direction="row" spacing="6">
        <Stack spacing="0" flex="1">
          <Text fontWeight="medium">{t("Locations and contacts")}</Text>
          <Text color="grey.400">
            {t("Export device locations and contacts information")}
          </Text>
        </Stack>
        <Switch w="initial" control={form.control} name="hasLocations" />
      </Stack>
      <Divider />
      <Stack direction="row" spacing="6">
        <Stack spacing="0" flex="1">
          <Text fontWeight="medium">{t("Compliance information")}</Text>
          <Text color="grey.400">
            {t("Export compliance report and information")}
          </Text>
        </Stack>
        <Switch w="initial" control={form.control} name="hasCompliance" />
      </Stack>
      <Divider />
    </Stack>
  );
}

export type ExportDataButtonProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function ExportDataButton(props: ExportDataButtonProps) {
  const { renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();

  const form = useForm<Form>({
    mode: "onChange",
    defaultValues: {
      format: EXPORT_MIMES_TYPES_OPTIONS[0],
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
  });

  const mutation = useMutation({
    mutationFn: async (queryParams: ReportExportDataQueryParams) =>
      api.report.exportData(queryParams),
    onSuccess(res) {
      dialog.close();
      download(res.blob, res.filename);
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const onSubmit = useCallback(
    async (values: Form) => {
      mutation.mutate({
        domain: values.domain?.value,
        group: values.groups.map((group) => group.id),
        groups: values.hasGroups,
        interfaces: values.hasInterfaces,
        inventory: values.hasInventory,
        inventoryhistory: values.hasInventoryHistory,
        locations: values.hasLocations,
        compliance: values.hasCompliance,
        devicedriverattributes: values.hasDeviceDriverAttributes,
      });
    },
    [mutation]
  );

  const dialog = Dialog.useForm({
    title: t("Export data"),
    description: <ExportDataForm />,
    form,
    isLoading: mutation.isPending,
    size: "2xl",
    onSubmit,
    onCancel() {
      form.reset();
    },
    submitButton: {
      label: t("Export"),
    },
  });

  return renderItem(dialog.open);
}

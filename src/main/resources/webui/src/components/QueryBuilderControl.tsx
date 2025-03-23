import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import { useToast } from "@/hooks";
import i18n from "@/i18n";
import {
  DeviceNetworkClass,
  DeviceSoftwareLevel,
  DeviceStatus,
  DeviceType,
  Diagnostic,
  Domain,
  Option,
} from "@/types";
import { sortAlphabetical, union } from "@/utils";
import {
  Button,
  Center,
  Heading,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  UseControllerProps,
  useController,
  useForm,
  useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import DeviceTypeSelect from "./DeviceTypeSelect";
import FormControl, { FormControlType } from "./FormControl";
import Select from "./Select";
import Icon from "./Icon";

type AttributeOption = Option<{
  name: string;
  type: string;
  choices?: Option<string | number>[];
}>;

enum AttributeType {
  Date = "DATE",
  Text = "TEXT",
  LongText = "LONGTEXT",
  Enum = "ENUM",
  Numeric = "NUMERIC",
  IpAddress = "IPADDRESS",
  MacAddress = "MACADDRESS",
  Id = "ID",
  Binary = "BINARY",
}

enum OperatorType {
  Is = "IS",
  In = "IN",
  Contains = "CONTAINS",
  ContainsNoCase = "CONTAINSNOCASE",
  StartsWith = "STARTSWITH",
  EndsWith = "ENDSWITH",
  Matches = "MATCHES",
  LessThan = "LESSTHAN",
  GreaterThan = "GREATERTHAN",
  Before = "BEFORE",
  After = "AFTER",
  BeforeRelative = "BEFORERELATIVE",
  True = "TRUE",
  False = "FALSE",
  Enum = "ENUM",
}

enum ConditionType {
  And = "AND",
  Or = "OR",
  Not = "NOT",
}

export type QueryBuilderValue = {
  query: string;
  driver: Option<DeviceType>;
};

const operatorOptionMapping = {
  [OperatorType.Is]: {
    label: i18n.t("is"),
    value: OperatorType.Is,
  },
  [OperatorType.In]: {
    label: i18n.t("in"),
    value: OperatorType.In,
  },
  [OperatorType.Contains]: {
    label: i18n.t("contains"),
    value: OperatorType.Contains,
  },
  [OperatorType.ContainsNoCase]: {
    label: i18n.t("contains (no case)"),
    value: OperatorType.ContainsNoCase,
  },
  [OperatorType.StartsWith]: {
    label: i18n.t("starts with"),
    value: OperatorType.StartsWith,
  },
  [OperatorType.EndsWith]: {
    label: i18n.t("ends with"),
    value: OperatorType.EndsWith,
  },
  [OperatorType.Matches]: {
    label: i18n.t("matches"),
    value: OperatorType.Matches,
  },
  [OperatorType.LessThan]: {
    label: i18n.t("less than"),
    value: OperatorType.LessThan,
  },
  [OperatorType.GreaterThan]: {
    label: i18n.t("greater than"),
    value: OperatorType.GreaterThan,
  },
  [OperatorType.Before]: {
    label: i18n.t("before"),
    value: OperatorType.Before,
  },
  [OperatorType.After]: {
    label: i18n.t("after"),
    value: OperatorType.After,
  },
  [OperatorType.BeforeRelative]: {
    label: i18n.t("before (relative)"),
    value: OperatorType.BeforeRelative,
  },
  [OperatorType.True]: {
    label: i18n.t("true"),
    value: OperatorType.True,
  },
  [OperatorType.False]: {
    label: i18n.t("false"),
    value: OperatorType.False,
  },
  [OperatorType.Enum]: {
    label: i18n.t("enum"),
    value: OperatorType.Enum,
  },
};

type OperatorOption = {
  label: string;
  value: OperatorType;
  callback(): string;
};

export type QueryBuilderControlProps<T> = {
  isRequired?: boolean;
} & UseControllerProps<T>;

export default function QueryBuilderControl<T>(
  props: QueryBuilderControlProps<T>
) {
  const { control, defaultValue, name, isRequired = false } = props;
  const toast = useToast();
  const { t } = useTranslation();
  const { field } = useController({
    name,
    control,
    defaultValue,
    rules: {
      required: isRequired,
    },
  });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const form = useForm<{
    query: string;
    driver: Option<DeviceType>;
    attribute: AttributeOption;
  }>({
    defaultValues: {
      query: (field.value as QueryBuilderValue)?.query ?? "",
      driver: (field.value as QueryBuilderValue)?.driver ?? {
        label: t("[Any]"),
        value: null,
      },
      attribute: null,
    },
  });

  const { isPending: isDomainPending, data: domains } = useQuery({
    queryKey: [QUERIES.DOMAIN_LIST],
    queryFn: async () => {
      return api.admin.getAllDomains({
        limit: 999,
        offset: 0,
      });
    },
    select: useCallback((domains: Domain[]): Option<number>[] => {
      return domains.map((domain) => ({
        label: domain?.name,
        value: domain?.id,
      }));
    }, []),
  });

  const { isPending: isDiagnosticPending, data: diagnostics } = useQuery({
    queryKey: [QUERIES.DIAGNOSTIC_LIST],
    queryFn: async () => {
      return api.diagnostic.getAll({
        limit: 999,
        offset: 0,
      });
    },
    select: useCallback((diagnostics: Diagnostic[]): AttributeOption[] => {
      return diagnostics.map(
        (diagnostic) =>
          ({
            label: `Diagnostic "${diagnostic?.name}"`,
            value: {
              name: `Diagnostic "${diagnostic?.name}"`,
              type: diagnostic?.resultType,
            },
          })
      );
    }, []),
  });

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const driver = useWatch({
    control: form.control,
    name: "driver.value",
  });

  const query = useWatch({
    control: form.control,
    name: "query",
  });

  const attributes = useMemo(() => {
    let options = [
      {
        label: t("Comments"),
        value: {
          name: "Comments",
          type: AttributeType.Text,
        },
      },
      {
        label: t("Contact"),
        value: {
          name: "Contact",
          type: AttributeType.Text,
        },
      },
      {
        label: t("Creation date"),
        value: {
          name: "Creation date",
          type: AttributeType.Date,
        },
      },
      {
        label: t("Device"),
        value: {
          name: "Device",
          type: AttributeType.Id,
        },
      },
      {
        label: t("Domain"),
        value: {
          name: "Domain",
          type: AttributeType.Enum,
          choices: domains,
        },
      },
      {
        label: t("Family"),
        value: {
          name: "Family",
          type: AttributeType.Text,
        },
      },
      {
        label: t("IP"),
        value: {
          name: "IP",
          type: AttributeType.IpAddress,
        },
      },
      {
        label: t("Interface"),
        value: {
          name: "Interfaces",
          type: AttributeType.Text,
        },
      },
      {
        label: t("Last change date"),
        value: {
          name: "Last change date",
          type: AttributeType.Date,
        },
      },
      {
        label: t("Location"),
        value: {
          name: "Location",
          type: AttributeType.Text,
        },
      },
      {
        label: t("MAC"),
        value: {
          name: "MAC",
          type: AttributeType.MacAddress,
        },
      },
      {
        label: t("Module"),
        value: {
          name: "Module",
          type: AttributeType.Text,
        },
      },
      {
        label: t("Name"),
        value: {
          name: "Name",
          type: AttributeType.Text,
        },
      },
      {
        label: t("Network class"),
        value: {
          name: "Network class",
          type: AttributeType.Enum,
          choices: [
            { label: t("Firewall"), value: DeviceNetworkClass.Firewall },
            {
              label: t("Load balancer"),
              value: DeviceNetworkClass.LoadBalancer,
            },
            { label: t("Router"), value: DeviceNetworkClass.Router },
            { label: t("Server"), value: DeviceNetworkClass.Server },
            { label: t("Switch"), value: DeviceNetworkClass.Switch },
            {
              label: t("Switch router"),
              value: DeviceNetworkClass.SwitchRouter,
            },
            { label: t("Access point"), value: DeviceNetworkClass.AccessPoint },
            {
              label: t("Wireless controller"),
              value: DeviceNetworkClass.WirelessController,
            },
            {
              label: t("Console server"),
              value: DeviceNetworkClass.ConsoleServer,
            },
            { label: t("Unknown"), value: DeviceNetworkClass.Unknown },
          ],
        },
      },
      {
        label: t("Software Level"),
        value: {
          name: "Software Level",
          type: AttributeType.Enum,
          choices: [
            { label: t("Gold"), value: DeviceSoftwareLevel.GOLD },
            { label: t("Silver"), value: DeviceSoftwareLevel.SILVER },
            { label: t("Bronze"), value: DeviceSoftwareLevel.BRONZE },
            { label: t("Unknown"), value: DeviceSoftwareLevel.UNKNOWN },
          ],
        },
      },
      {
        label: t("Software version"),
        value: {
          name: "Software version",
          type: AttributeType.Text,
        },
      },
      {
        label: t("Status"),
        value: {
          name: "Status",
          type: AttributeType.Enum,
          choices: [
            { label: t("Production"), value: DeviceStatus.Production },
            { label: t("Disabled"), value: DeviceStatus.Disabled },
            { label: t("PreProduction"), value: DeviceStatus.PreProduction },
          ],
        },
      },
      {
        label: t("VRF"),
        value: {
          name: "VRF",
          type: AttributeType.Text,
        },
      },
      {
        label: t("Virtual name"),
        value: {
          name: "Virtual Name",
          type: AttributeType.Text,
        },
      },
    ] as AttributeOption[];

    if (diagnostics?.length > 0) {
      options = [...options, ...diagnostics];
    }

    if (driver?.attributes) {
      const driverOptions = driver.attributes.map((attr) => ({
        label: t(attr.title),
        value: {
          name: attr.title,
          type: attr.type,
        },
      }));

      options = union(options, driverOptions);
    }

    return sortAlphabetical(options, "label");
  }, [driver, domains, diagnostics]);

  const selectedAttribute = useWatch({
    control: form.control,
    name: "attribute.value",
  });

  const isAttributeEnum = useMemo(
    () => selectedAttribute?.type === AttributeType.Enum,
    [selectedAttribute]
  );

  const operatorOptions: OperatorOption[] = useMemo(() => {
    if (
      selectedAttribute?.type === AttributeType.Text ||
      selectedAttribute?.type === AttributeType.LongText
    ) {
      return [
        {
          ...operatorOptionMapping[OperatorType.Is],
          callback: () => `[${selectedAttribute.name}] IS "text"`,
        },
        {
          ...operatorOptionMapping[OperatorType.Contains],
          callback: () => `[${selectedAttribute.name}] CONTAINS "text"`,
        },
        {
          ...operatorOptionMapping[OperatorType.ContainsNoCase],
          callback: () => `[${selectedAttribute.name}] CONTAINSNOCASE "text"`,
        },
        {
          ...operatorOptionMapping[OperatorType.StartsWith],
          callback: () => `[${selectedAttribute.name}] STARTSWITH "text"`,
        },
        {
          ...operatorOptionMapping[OperatorType.EndsWith],
          callback: () => `[${selectedAttribute.name}] ENDSWITH "text"`,
        },
        {
          ...operatorOptionMapping[OperatorType.Matches],
          callback: () => `[${selectedAttribute.name}] MATCHES "pattern"`,
        },
      ];
    } else if (selectedAttribute?.type === AttributeType.Numeric) {
      return [
        {
          ...operatorOptionMapping[OperatorType.Is],
          callback: () => `[${selectedAttribute.name}] IS 42`,
        },
        {
          ...operatorOptionMapping[OperatorType.LessThan],
          callback: () => `[${selectedAttribute.name}] LESSTHAN 42`,
        },
        {
          ...operatorOptionMapping[OperatorType.GreaterThan],
          callback: () => `[${selectedAttribute.name}] GREATERTHAN 42`,
        },
      ];
    } else if (selectedAttribute?.type === AttributeType.Id) {
      return [
        {
          ...operatorOptionMapping[OperatorType.Is],
          callback: () => `[${selectedAttribute.name}] IS 42`,
        },
      ];
    } else if (selectedAttribute?.type === AttributeType.Date) {
      return [
        {
          ...operatorOptionMapping[OperatorType.Is],
          callback: () => `[${selectedAttribute.name}] IS "2023-01-01"`,
        },
        {
          ...operatorOptionMapping[OperatorType.Before],
          callback: () => `[${selectedAttribute.name}] BEFORE "2023-01-01"`,
        },
        {
          ...operatorOptionMapping[OperatorType.After],
          callback: () => `[${selectedAttribute.name}] AFTER "2023-01-01"`,
        },
        {
          ...operatorOptionMapping[OperatorType.BeforeRelative],
          callback: () => `[${selectedAttribute.name}] BEFORE "NOW -1d"`,
        },
      ];
    } else if (
      selectedAttribute?.type === AttributeType.IpAddress ||
      selectedAttribute?.type === AttributeType.MacAddress
    ) {
      return [
        {
          ...operatorOptionMapping[OperatorType.Is],
          callback: () => `[${selectedAttribute.name}] IS 16.16.16.16`,
        },
        {
          ...operatorOptionMapping[OperatorType.In],
          callback: () => `[${selectedAttribute.name}] IN 16.16.0.0/16`,
        },
      ];
    } else if (selectedAttribute?.type === AttributeType.Binary) {
      return [
        {
          ...operatorOptionMapping[OperatorType.True],
          callback: () => `[${selectedAttribute.name}] IS TRUE`,
        },
        {
          ...operatorOptionMapping[OperatorType.False],
          callback: () => `[${selectedAttribute.name}] IS FALSE`,
        },
      ];
    } else {
      return [];
    }
  }, [selectedAttribute]);

  useEffect(() => {
    const { unsubscribe } = form.watch((values) => {
      field.onChange(values);
    });

    return () => unsubscribe();
  }, [form]);

  const setCondition = useCallback(
    (type?: ConditionType) => {
      let updatedQuery = "";

      if (type === ConditionType.And || type === ConditionType.Or) {
        updatedQuery = `(${query}) ${type} ()`;

        // @note: Wait React render (Stack)
        setTimeout(() => {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(
            updatedQuery.length - 1,
            updatedQuery.length - 1
          );
        });
      } else if (type === ConditionType.Not) {
        updatedQuery = `NOT (${query})`;
      }

      form.setValue("query", updatedQuery);
    },
    [form, query]
  );

  const updateSelection = useCallback(
    (value: string) => {
      const position = inputRef.current.selectionStart;
      const before = inputRef.current.value.substring(0, position);
      const after = inputRef.current.value.substring(
        position,
        inputRef.current.value.length
      );

      inputRef.current.selectionStart = inputRef.current.selectionEnd =
        position + value.length;

      inputRef.current.focus();

      return {
        before,
        after,
      };
    },
    [inputRef]
  );

  const handleOperatorTrigger = useCallback(
    (option: OperatorOption) => {
      const newValue = option.callback();
      const { before, after } = updateSelection(newValue);

      form.setValue("query", `${before} ${newValue} ${after}`);
    },
    [form, updateSelection]
  );

  const handleEnumTrigger = useCallback(
    (option: Option<string | number>) => {
      let newValue = "";

      if (typeof option.value === "string") {
        newValue = `[${selectedAttribute.name}] IS "${option.value}"`;
      } else if (typeof option.value === "number") {
        newValue = `[${selectedAttribute.name}] IS ${option.value}`;
      }

      const { before, after } = updateSelection(newValue);

      form.setValue("query", `${before} ${newValue} ${after}`);
    },
    [selectedAttribute, form, updateSelection]
  );

  if (isDomainPending || isDiagnosticPending) {
    return (
      <Center>
        <Stack alignItems="center" spacing="4">
          <Spinner size="lg" />
          <Stack alignItems="center" spacing="1">
            <Heading size="md">{t("Loading")}</Heading>
            <Text color="grey.400">
              {t("Query builder is being initialized")}
            </Text>
          </Stack>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack spacing="5" ref={wrapperRef}>
      <DeviceTypeSelect control={form.control} name="driver" withAny />
      <FormControl
        control={form.control}
        name="query"
        type={FormControlType.LongText}
        rows={8}
        ref={inputRef}
      />
      <Stack direction="row" spacing="3">
        <Button
          onClick={() => setCondition()}
          leftIcon={<Icon name="x" />}
        >
          {t("Clear")}
        </Button>
        <Button onClick={() => setCondition(ConditionType.Not)}>
          {t("not")}
        </Button>
        <Button onClick={() => setCondition(ConditionType.And)}>
          {t("and")}
        </Button>
        <Button onClick={() => setCondition(ConditionType.Or)}>
          {t("or")}
        </Button>
      </Stack>
      <Select
        control={form.control}
        name="attribute"
        options={attributes}
        placeholder={t("Select attribute...")}
      />

      <Stack direction="row" spacing="3">
        {isAttributeEnum ? (
          <>
            {selectedAttribute.choices.map((choice) => (
              <Button
                key={choice.label}
                onClick={() => handleEnumTrigger(choice)}
              >
                {choice?.label}
              </Button>
            ))}
          </>
        ) : (
          <>
            {operatorOptions.map((option) => (
              <Button
                key={option.label}
                onClick={() => handleOperatorTrigger(option)}
              >
                {option?.label}
              </Button>
            ))}
          </>
        )}
      </Stack>
    </Stack>
  );
}

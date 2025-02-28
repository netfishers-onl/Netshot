import {
  DomainSelect,
  Icon,
  PolicySelect,
  TreeGroupSelector,
} from "@/components";
import Search from "@/components/Search";
import { Dialog } from "@/dialog";
import { useThrottle } from "@/hooks";
import { Group, Option } from "@/types";
import { IconButton, Stack } from "@chakra-ui/react";
import {
  MouseEvent,
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useConfigurationCompliance } from "../contexts";

type FilterForm = {
  domains: Option<number>[];
  groups: Group[];
  policies: Option<number>[];
};

function ConfigurationComplianceSidebarSearchFilterForm() {
  const form = useFormContext();

  const groups = useWatch({
    control: form.control,
    name: "groups",
  });

  const onGroupSelect = useCallback(
    (selectedGroups: Group[]) => {
      form.setValue("groups", selectedGroups);
    },
    [form]
  );

  return (
    <Stack>
      <DomainSelect isMulti control={form.control} name="domains" />
      <TreeGroupSelector
        value={groups}
        onChange={onGroupSelect}
        withAny
        isMulti
      />
      <PolicySelect isMulti control={form.control} name="policies" />
    </Stack>
  );
}

type ConfigurationComplianceSidebarSearchFilterProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

function ConfigurationComplianceSidebarSearchFilter(
  props: ConfigurationComplianceSidebarSearchFilterProps
) {
  const { renderItem } = props;

  const { t } = useTranslation();
  const ctx = useConfigurationCompliance();
  const form = useForm<FilterForm>({
    defaultValues: {
      domains: ctx.filters.domains,
      groups: ctx.filters.groups,
      policies: ctx.filters.policies,
    },
  });

  const onSubmit = useCallback(
    (values: FilterForm) => {
      ctx.setFilters({
        domains: values.domains,
        groups: values.groups,
        policies: values.policies,
      });

      dialog.close();
    },
    [form]
  );

  const dialog = Dialog.useForm({
    title: t("Advanced filters"),
    description: <ConfigurationComplianceSidebarSearchFilterForm />,
    form,
    onSubmit,
    onCancel() {
      form.reset();
      onSubmit(form.getValues());
    },
    submitButton: {
      label: t("Apply filters"),
    },
    cancelButton: {
      label: t("Clear all"),
    },
  });

  return renderItem(dialog.open);
}

export default function ConfigurationComplianceSidebarSearch() {
  const { t } = useTranslation();
  const ctx = useConfigurationCompliance();
  const [query, setQuery] = useState<string>("");
  const throttledValue = useThrottle(query);

  const onQuery = useCallback((query: string) => {
    setQuery(query);
  }, []);

  const onClear = useCallback(() => {
    ctx.setQuery("");
  }, [ctx]);

  useEffect(() => {
    ctx.setQuery(throttledValue);
  }, [throttledValue]);

  return (
    <Stack p="6" spacing="5">
      <Search
        clear={Boolean(ctx.query)}
        placeholder={t("Search...")}
        onQuery={onQuery}
        onClear={onClear}
      >
        <ConfigurationComplianceSidebarSearchFilter
          renderItem={(open) => (
            <IconButton
              onClick={open}
              variant="ghost"
              aria-label={t("Open filter")}
              icon={<Icon name="filter" />}
            />
          )}
        />
      </Search>
    </Stack>
  );
}

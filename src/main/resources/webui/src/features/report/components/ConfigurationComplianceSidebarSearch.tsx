import { DomainSelect, Icon, PolicySelect, TreeGroupSelector } from "@/components"
import Search from "@/components/Search"
import { useFormDialog } from "@/dialog"
import { PropsWithRenderItem } from "@/types"
import { IconButton, Stack } from "@chakra-ui/react"
import { useCallback } from "react"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useShallow } from "zustand/react/shallow"
import { useConfigurationComplianceSidebarStore } from "../stores/useConfigurationComplianceSidebarStore"

type FilterForm = {
  domains: number[]
  groups: number[]
  policies: number[]
}

function ConfigurationComplianceSidebarSearchFilterForm() {
  const form = useFormContext()

  const groups = useWatch({
    control: form.control,
    name: "groups",
  })

  const onGroupSelect = useCallback(
    (selectedGroups: number[]) => {
      form.setValue("groups", selectedGroups)
    },
    [form]
  )

  return (
    <Stack>
      <DomainSelect multiple control={form.control} name="domains" />
      <TreeGroupSelector value={groups} onChange={onGroupSelect} withAny isMulti />
      <PolicySelect multiple control={form.control} name="policies" />
    </Stack>
  )
}

type ConfigurationComplianceSidebarSearchFilterProps = PropsWithRenderItem

function ConfigurationComplianceSidebarSearchFilter(
  props: ConfigurationComplianceSidebarSearchFilterProps
) {
  const { renderItem } = props

  const { t } = useTranslation()
  const { domains, groups, policies, setFilters } = useConfigurationComplianceSidebarStore(
    useShallow((state) => ({
      domains: state.domains,
      groups: state.groups,
      policies: state.policies,
      setFilters: state.setFilters,
    }))
  )

  const dialog = useFormDialog()
  const form = useForm<FilterForm>({
    defaultValues: {
      domains,
      groups,
      policies,
    },
  })

  const open = () => {
    const dialogRef = dialog.open({
      title: t("advancedFilters"),
      description: <ConfigurationComplianceSidebarSearchFilterForm />,
      form,
      onSubmit(values: FilterForm) {
        setFilters(values)

        dialogRef.close()
      },
      onCancel() {
        form.reset()
        setFilters(form.getValues())
        dialogRef.close()
      },
      submitButton: {
        label: t("applyFilters"),
      },
      cancelButton: {
        label: t("clearAll"),
      },
    })
  }

  return renderItem(open)
}

export default function ConfigurationComplianceSidebarSearch() {
  const { t } = useTranslation()
  const { query, setQuery } = useConfigurationComplianceSidebarStore(
    useShallow((state) => ({
      query: state.query,
      setQuery: state.setQuery,
    }))
  )

  const onQuery = (query: string) => {
    setQuery(query)
  }

  const onClear = () => {
    setQuery("")
  }

  return (
    <Stack p="6" gap="5">
      <Search
        clear={Boolean(query)}
        placeholder={t("search2")}
        onQuery={onQuery}
        onClear={onClear}
      >
        <ConfigurationComplianceSidebarSearchFilter
          renderItem={(open) => (
            <IconButton onClick={open} variant="ghost" aria-label={t("openFilter")}>
              <Icon name="filter" />
            </IconButton>
          )}
        />
      </Search>
    </Stack>
  )
}

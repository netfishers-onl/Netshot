import { Button, Stack, Tabs } from "@chakra-ui/react"
import { useRef } from "react"
import { UseControllerProps } from "react-hook-form"
import { useTranslation } from "react-i18next"
import FormControl, { FormControlType } from "../FormControl"
import { ComplianceRuleResultPanel } from "./ComplianceRuleResultPanel"
import { DiagnosticResultPanel } from "./DiagnosticResultPanel"
import { GenericAttributePanel } from "./GenericAttributePanel"
import { TypeSpecificAttributePanel } from "./TypeSpecificAttributePanel"
import { AttributeGroupType, ConditionType } from "./types"
import { useQueryBuilder } from "./useQueryBuilder"

export type QueryBuilderDialogProps<T> = {
  required?: boolean
} & UseControllerProps<T>

export function QueryBuilderDialog<T>(props: QueryBuilderDialogProps<T>) {
  const { control, defaultValue, name, required = false } = props
  const { t } = useTranslation()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { form } = useQueryBuilder({ control, name, defaultValue, required })
  const [query] = form.watch(["query"])

  function insertSnippet(snippet: string) {
    const textarea = inputRef.current
    const position = textarea?.selectionStart ?? 0
    const current = textarea?.value ?? ""
    const before = current.substring(0, position).trimEnd()
    const after = current.substring(position).trimStart()
    const newValue = [before, snippet, after].filter(Boolean).join(" ")
    if (textarea) {
      textarea.selectionStart = textarea.selectionEnd =
        before.length + (before ? 1 : 0) + snippet.length
      textarea.focus()
    }
    form.setValue("query", newValue)
  }

  function setCondition(type?: ConditionType) {
    let updatedQuery: string

    if (type === ConditionType.And || type === ConditionType.Or) {
      updatedQuery = t('queryType', '({{query}}) {{type}} ()', { query, type })
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.setSelectionRange(updatedQuery.length - 1, updatedQuery.length - 1)
      })
    } else if (type === ConditionType.Not) {
      updatedQuery = t('notQuery', 'NOT ({{query}})', { query })
    } else {
      updatedQuery = ""
    }

    form.setValue("query", updatedQuery)
  }

  return (
    <Stack gap="5">
      <FormControl
        control={form.control}
        name="query"
        type={FormControlType.LongText}
        rows={3}
        ref={inputRef}
        placeholder={t("common.eG", { example: "[IP] is 16.16.16.16" })}
        clearable
      />
      <Stack direction="row" gap="3">
        <Button size="sm" onClick={() => setCondition(ConditionType.Not)}>{t("common.not")}</Button>
        <Button size="sm" onClick={() => setCondition(ConditionType.And)}>{t("common.and")}</Button>
        <Button size="sm" onClick={() => setCondition(ConditionType.Or)}>{t("common.or")}</Button>
      </Stack>
      <Tabs.Root defaultValue={AttributeGroupType.Generic} variant="subtle" size="lg">
        <Tabs.List>
          <Tabs.Trigger value={AttributeGroupType.Generic}>{t('genericAttributes', 'Generic attributes')}</Tabs.Trigger>
          <Tabs.Trigger value={AttributeGroupType.TypeSpecific}>{t('typespecific', 'Type-specific')}</Tabs.Trigger>
          <Tabs.Trigger value={AttributeGroupType.ComplianceRuleResult}>
            {t('complianceRules', 'Compliance rules')}
          </Tabs.Trigger>
          <Tabs.Trigger value={AttributeGroupType.DiagnosticResult}>{t('diagnostics', 'Diagnostics')}</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content paddingX="6" value={AttributeGroupType.Generic}>
          <GenericAttributePanel onInsert={insertSnippet} />
        </Tabs.Content>
        <Tabs.Content paddingX="6" value={AttributeGroupType.TypeSpecific}>
          <TypeSpecificAttributePanel onInsert={insertSnippet} />
        </Tabs.Content>
        <Tabs.Content paddingX="6" value={AttributeGroupType.ComplianceRuleResult}>
          <ComplianceRuleResultPanel onInsert={insertSnippet} />
        </Tabs.Content>
        <Tabs.Content paddingX="6" value={AttributeGroupType.DiagnosticResult}>
          <DiagnosticResultPanel onInsert={insertSnippet} />
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  )
}

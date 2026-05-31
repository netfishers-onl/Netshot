import { useDiagnostics } from "@/features/diagnostic/api"
import { Stack } from "@chakra-ui/react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Select } from "../Select"
import { AttributeForm } from "./AttributeForm"

type Props = {
  onInsert(snippet: string): void
}

export function DiagnosticResultPanel({ onInsert }: Props) {
  const { t } = useTranslation()
  const form = useForm<{ diagnostic: string | null }>({ defaultValues: { diagnostic: null } })
  const [diagnosticId] = form.watch(["diagnostic"])
  const diagnosticQuery = useDiagnostics()

  const diagnostics = diagnosticQuery.data ?? []
  const diagnosticOptions = diagnostics.map((d) => ({ label: d.name, value: d.id }))
  const diagnostic = diagnostics.find((d) => d.id === Number(diagnosticId))

  useEffect(() => {
    if (diagnostics.length > 0 && !form.getValues("diagnostic")) {
      form.setValue("diagnostic", String(diagnostics[0].id))
    }
  }, [diagnostics.length])

  const attribute = diagnostic
    ? { name: t('diagnosticName', 'Diagnostic > {{name}}', { name: diagnostic.name }), type: diagnostic.resultType }
    : null

  return (
    <Stack gap="3" pt="3">
      <Select
        control={form.control}
        name="diagnostic"
        label={t("diagnostic.label")}
        placeholder={t("diagnostic.select")}
        options={diagnosticOptions}
        isLoading={diagnosticQuery.isPending}
      />
      {attribute && (
        <AttributeForm key={attribute.name} attribute={attribute} onInsert={onInsert} />
      )}
    </Stack>
  )
}

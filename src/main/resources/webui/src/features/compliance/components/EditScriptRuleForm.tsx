import { MonacoEditorControl, Switch } from "@/components"
import FormControl from "@/components/FormControl"
import { RuleType } from "@/types"
import { Stack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { RuleForm } from "../types"

export type EditScriptRuleFormProps = {
  type: RuleType
}

export default function EditScriptRuleForm(props: EditScriptRuleFormProps) {
  const { type } = props
  const form = useFormContext<RuleForm>()
  const { t } = useTranslation()
  const language = useMemo(() => (type === RuleType.Python ? "python" : "javascript"), [type])

  return (
    <Stack direction="row" gap="7" overflow="auto" flex="1">
      {/* Left — base fields */}
      <Stack gap="6" p="3" w="280px" flexShrink={0}>
        <FormControl
          required
          label={t("common.name")}
          placeholder={t("common.name")}
          control={form.control}
          name="name"
        />
        <Switch control={form.control} name="enabled" label={t("common.enabled")} />
      </Stack>

      {/* Right — script editor */}
      <Stack flex="1" overflow="auto">
        <MonacoEditorControl required control={form.control} name="script" language={language} />
      </Stack>
    </Stack>
  )
}

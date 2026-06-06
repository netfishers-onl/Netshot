import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { PropsWithRenderItem, Rule, RuleType } from "@/types"
import { booleanToString, stringToBoolean } from "@/utils"
import { MouseEvent, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useUpdateRule } from "../api"
import { RuleForm } from "../types"
import { EditTextRuleForm } from "./EditTextRuleForm"
import EditScriptRuleForm from "./EditScriptRuleForm"
import TestRuleOnDeviceButton from "./TestRuleOnDeviceButton"

export type EditRuleButtonProps = PropsWithRenderItem<{
  policyId: number
  rule: Rule
}>

export default function EditRuleButton(props: EditRuleButtonProps) {
  const { policyId, rule, renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const dialog = useFormDialogWithMutation()

  const defaultValues = useMemo(() => {
    return {
      name: rule?.name,
      enabled: rule?.enabled ?? true,
      script: rule?.script,
      text: rule?.text ?? "",
      regExp: rule?.regExp,
      context: rule?.context ?? "",
      driver: rule?.deviceDriver,
      field: rule?.field,
      matchAll: rule?.matchAll,
      anyBlock: booleanToString(rule?.anyBlock),
      invert: booleanToString(rule?.invert),
      normalize: rule?.normalize,
    } as RuleForm
  }, [rule])

  const form = useForm<RuleForm>({
    mode: "onChange",
    defaultValues,
  })

  const mutation = useUpdateRule(rule)

  const hasScript = useMemo(
    () => rule?.type === RuleType.Javascript || rule?.type === RuleType.Python,
    [rule]
  )

  const open = (evt: MouseEvent) => {
    evt?.stopPropagation()
    const dialogRef = dialog.open(MUTATIONS.RULE_UPDATE, {
      title: t("policy.rule.edit"),
      description: hasScript ? (
        <EditScriptRuleForm type={rule?.type} />
      ) : (
        <EditTextRuleForm type={rule?.type} />
      ),
      footerStart: <TestRuleOnDeviceButton type={rule?.type} />,
      bodyProps: !hasScript ? { overflow: "hidden", display: "flex" } : undefined,
      form,
      size: "xl",
      variant: hasScript ? "full-floating" : null,
      async onSubmit(values: RuleForm) {
        await mutation.mutateAsync({
          id: rule.id,
          name: values.name,
          driver: values.driver,
          field: values.field,
          context: values.context,
          script: values.script,
          text: values.text,
          anyBlock: stringToBoolean(values.anyBlock),
          matchAll: values.matchAll,
          invert: stringToBoolean(values.invert),
          normalize: values.normalize,
          enabled: values.enabled,
          policy: policyId,
          regExp: values.regExp,
          type: rule.type,
        })

        dialogRef.close()
        form.reset()

        toast.success({
          title: t("common.success"),
          description: t("policy.rule.successfullyUpdated", {
            name: values.name,
          }),
        })
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("common.applyChanges"),
      },
    })
  }

  useEffect(() => {
    form.reset(defaultValues)
  }, [rule])

  return renderItem(open)
}

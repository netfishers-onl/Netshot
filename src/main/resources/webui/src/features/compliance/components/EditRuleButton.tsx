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
import { RuleEditForm } from "./RuleEditForm"
import RuleEditScript from "./RuleEditScript"

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
    const values = {
      name: rule?.name,
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

    return values
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
      title: t("editRule"),
      description: hasScript ? (
        <RuleEditScript type={rule?.type} />
      ) : (
        <RuleEditForm type={rule?.type} />
      ),
      form,
      size: "lg",
      variant: hasScript ? "full-floating" : null,
      async onSubmit(values: RuleForm) {
        console.log(values)
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
          enabled: rule.enabled,
          policy: policyId,
          regExp: values.regExp,
          type: rule.type,
        })

        dialogRef.close()

        toast.success({
          title: t("success"),
          description: t("ruleHasBeenSuccessfullyUpdated", {
            name: values.name,
          }),
        })
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("applyChanges"),
      },
    })
  }

  useEffect(() => {
    form.reset(defaultValues)
  }, [rule])

  return renderItem(open)
}

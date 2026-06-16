import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Rule, RuleType } from "@/types"
import { booleanToString, stringToBoolean } from "@/utils"
import { MouseEvent, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"
import { useUpdateRule } from "../api"
import { RuleForm } from "../types"
import { EditTextRuleForm } from "./EditTextRuleForm"
import EditScriptRuleForm from "./EditScriptRuleForm"

export type EditRuleTriggerProps = { policyId: number; rule: Rule; children: React.ReactElement<any> } & Record<string, unknown>

export default function EditRuleTrigger({ policyId, rule, children, ...rest }: EditRuleTriggerProps) {
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
        form.reset(values)

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

  // Menu.Item already triggers `onClick` internally to fire `onSelect`, so binding
  // both to the same handler would call it twice; pick the one the child understands.
  const isMenuItem = "value" in children.props
  return React.cloneElement(children, isMenuItem ? { onSelect: open, ...rest } : { ...rest, onClick: open })
}

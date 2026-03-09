import api, { CreateOrUpdateSoftwareRule } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { PropsWithRenderItem, SoftwareRule } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"
import { SoftwareRuleFormValues } from "../types"
import SoftwareRuleForm from "./SoftwareRuleForm"

export type EditSoftwareRuleButtonProps = PropsWithRenderItem<{
  rule: SoftwareRule
}>

export default function EditSoftwareRuleButton(props: EditSoftwareRuleButtonProps) {
  const { rule, renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const dialog = useFormDialogWithMutation()

  const defaultValues = useMemo(() => {
    return {
      driver: rule.driver,
      family: rule?.family,
      familyRegExp: rule?.familyRegExp,
      group: rule.targetGroup?.id,
      level: rule?.level,
      partNumber: rule?.partNumber,
      partNumberRegExp: rule?.partNumberRegExp,
      version: rule?.version,
      versionRegExp: rule?.versionRegExp,
    }
  }, [rule])

  const form = useForm<SoftwareRuleFormValues>({
    mode: "onChange",
    defaultValues,
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.SOFTWARE_RULE_UPDATE,
    mutationFn: async (payload: CreateOrUpdateSoftwareRule) =>
      api.softwareRule.update(rule.id, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.SOFTWARE_RULE_UPDATE, {
      title: t("Edit software rule"),
      description: <SoftwareRuleForm rule={rule} />,
      form,
      size: "lg",
      async onSubmit(values: SoftwareRuleFormValues) {
        await mutation.mutateAsync({
          id: rule.id,
          driver: values.driver,
          family: values.family,
          familyRegExp: values.familyRegExp,
          group: values.group,
          level: values.level,
          partNumber: values.partNumber,
          partNumberRegExp: values.partNumberRegExp,
          version: values.version,
          versionRegExp: values.versionRegExp,
        })

        dialogRef.close()

        toast.success({
          title: t("Success"),
          description: t("Software rule has been successfully modified"),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.SOFTWARE_RULE_LIST] })
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("Apply changes"),
      },
    })
  }

  return renderItem(open)
}

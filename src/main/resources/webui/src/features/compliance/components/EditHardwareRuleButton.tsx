import api, { CreateOrUpdateHardwareRule } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { HardwareRule, PropsWithRenderItem } from "@/types"
import { getDateFromUnix } from "@/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"
import { HardwareRuleFormValues } from "../types"
import HardwareRuleForm from "./HardwareRuleForm"

export type EditHardwareRuleButtonProps = PropsWithRenderItem<{
  rule: HardwareRule
}>

export default function EditHardwareRuleButton(props: EditHardwareRuleButtonProps) {
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
      partNumber: rule?.partNumber,
      partNumberRegExp: rule?.partNumberRegExp,
      endOfLife: getDateFromUnix(rule?.endOfLife),
      endOfSale: getDateFromUnix(rule?.endOfSale),
    }
  }, [rule])

  const form = useForm<HardwareRuleFormValues>({
    mode: "onChange",
    defaultValues,
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.HARDWARE_RULE_UPDATE,
    mutationFn: async (payload: CreateOrUpdateHardwareRule) =>
      api.hardwareRule.update(rule.id, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.HARDWARE_RULE_UPDATE, {
      title: t("Edit hardware rule"),
      description: <HardwareRuleForm rule={rule} />,
      form,
      size: "lg",
      async onSubmit(values: HardwareRuleFormValues) {
        await mutation.mutateAsync({
          id: rule.id,
          driver: values.driver,
          family: values.family,
          familyRegExp: values.familyRegExp,
          group: values.group,
          partNumber: values.partNumber,
          partNumberRegExp: values.partNumberRegExp,
          endOfLife: values.endOfLife,
          endOfSale: values.endOfSale,
        })

        dialogRef.close()

        toast.success({
          title: t("Success"),
          description: t("Hardware rule has been successfully modified"),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.HARDWARE_RULE_LIST] })
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

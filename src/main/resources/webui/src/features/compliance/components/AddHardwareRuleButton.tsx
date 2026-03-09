import api, { CreateOrUpdateHardwareRule } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { PropsWithRenderItem } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"
import { HardwareRuleFormValues } from "../types"
import HardwareRuleForm from "./HardwareRuleForm"

export type AddHardwareRuleButtonProps = PropsWithRenderItem

export default function AddHardwareRuleButton(props: AddHardwareRuleButtonProps) {
  const { renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const dialog = useFormDialogWithMutation()

  const form = useForm<HardwareRuleFormValues>({
    mode: "onChange",
    defaultValues: {
      driver: null,
      family: "",
      familyRegExp: false,
      group: null,
      partNumber: "",
      partNumberRegExp: false,
      endOfLife: "",
      endOfSale: "",
    },
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.HARDWARE_RULE_CREATE,
    mutationFn: async (payload: CreateOrUpdateHardwareRule) => api.hardwareRule.create(payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.HARDWARE_RULE_CREATE, {
      title: t("Add hardware rule"),
      description: <HardwareRuleForm />,
      form,
      size: "lg",
      async onSubmit(values: HardwareRuleFormValues) {
        await mutation.mutateAsync({
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
          description: t("Hardware rule has been successfully created"),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.HARDWARE_RULE_LIST] })
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("Add rule"),
      },
    })
  }

  return renderItem(open)
}

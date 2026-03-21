import api, { CreateOrUpdateSoftwareRule } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useDeviceLevelOptions, useToast } from "@/hooks"
import { PropsWithRenderItem } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"
import { SoftwareRuleFormValues } from "../types"
import SoftwareRuleForm from "./SoftwareRuleForm"

export type AddSoftwareRuleButtonProps = PropsWithRenderItem

export default function AddSoftwareRuleButton(props: AddSoftwareRuleButtonProps) {
  const { renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const deviceLevelOptions = useDeviceLevelOptions()
  const dialog = useFormDialogWithMutation()

  const form = useForm<SoftwareRuleFormValues>({
    mode: "onChange",
    defaultValues: {
      driver: null,
      family: "",
      familyRegExp: false,
      group: null,
      level: deviceLevelOptions.options[0].value,
      partNumber: "",
      partNumberRegExp: false,
      version: "",
      versionRegExp: false,
    },
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.SOFTWARE_RULE_CREATE,
    mutationFn: async (payload: CreateOrUpdateSoftwareRule) => api.softwareRule.create(payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.SOFTWARE_RULE_CREATE, {
      title: t("addSoftwareRule"),
      description: <SoftwareRuleForm />,
      form,
      size: "lg",
      async onSubmit(values: SoftwareRuleFormValues) {
        await mutation.mutateAsync({
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
          title: t("success"),
          description: t("softwareRuleHasBeenSuccessfullyCreated"),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.SOFTWARE_RULE_LIST] })
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("addRule"),
      },
    })
  }

  return renderItem(open)
}

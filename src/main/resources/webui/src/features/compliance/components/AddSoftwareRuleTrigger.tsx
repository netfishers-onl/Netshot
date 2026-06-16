import api, { CreateOrUpdateSoftwareRule } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useSoftwareLevels, useToast } from "@/hooks"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"
import { QUERIES } from "../constants"
import { SoftwareRuleFormValues } from "../types"
import SoftwareRuleForm from "./SoftwareRuleForm"

export type AddSoftwareRuleTriggerProps = { children: React.ReactElement<any> } & Record<string, unknown>

export default function AddSoftwareRuleTrigger({ children, ...rest }: AddSoftwareRuleTriggerProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { getDefault: getDefaultLevel } = useSoftwareLevels()
  const dialog = useFormDialogWithMutation()

  const form = useForm<SoftwareRuleFormValues>({
    mode: "onChange",
    defaultValues: {
      driver: null,
      family: "",
      familyRegExp: false,
      group: null,
      level: getDefaultLevel(),
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
      title: t("compliance.software.addRule"),
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
        form.reset()

        toast.success({
          title: t("common.success"),
          description: t("compliance.software.ruleCreated"),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.SOFTWARE_RULE_LIST] })
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("policy.rule.add"),
      },
    })
  }

  return React.cloneElement(children, { onClick: open, onSelect: open, ...rest })
}

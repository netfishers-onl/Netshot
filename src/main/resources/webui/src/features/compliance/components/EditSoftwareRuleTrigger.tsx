import api, { CreateOrUpdateSoftwareRule } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { SoftwareRule } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"
import Slot from "@/components/Slot"
import { QUERIES } from "../constants"
import { SoftwareRuleFormValues } from "../types"
import SoftwareRuleForm from "./SoftwareRuleForm"

export type EditSoftwareRuleTriggerProps = { rule: SoftwareRule; children: React.ReactElement<Record<string, unknown>> } & Record<string, unknown>

export default function EditSoftwareRuleTrigger({ rule, children, ...rest }: EditSoftwareRuleTriggerProps) {
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

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

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
      title: t("compliance.software.editRule"),
      description: <SoftwareRuleForm rule={rule} />,
      form,
      size: "lg",
      async onSubmit(values: SoftwareRuleFormValues) {
        await mutation.mutateAsync({
          id: rule.id,
          driver: values.driver!,
          family: values.family,
          familyRegExp: values.familyRegExp,
          group: values.group!,
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
          description: t("compliance.software.ruleModified"),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.SOFTWARE_RULE_LIST] })
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("common.applyChanges"),
      },
    })
  }

  return <Slot onTrigger={open} {...rest}>{children}</Slot>
}

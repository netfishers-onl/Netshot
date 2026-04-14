import api, { CreateOrUpdateRule } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { BoxWithIconButton } from "@/components"
import { QUERIES as GLOBAL_QUERIES } from "@/constants"
import { useDialogConfig } from "@/dialog"
import { useToast } from "@/hooks"
import { Policy, RuleType } from "@/types"
import { stringToBoolean } from "@/utils"
import { Button, Dialog, Heading, Portal, Stack, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { QUERIES, RULE_SCRIPT_TEMPLATE } from "../constants"
import { RuleForm } from "../types"
import { RuleEditForm } from "./RuleEditForm"
import RuleEditScript from "./RuleEditScript"

enum FormStep {
  Type,
  Details,
}

export default function AddRuleDialog({ policy }: { policy: Policy }) {
  const { t } = useTranslation()
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const dialogConfig = useDialogConfig()
  const [type, setType] = useState(RuleType.Text)
  const [formStep, setFormStep] = useState(FormStep.Type)

  const form = useForm<RuleForm>({
    defaultValues: {
      name: "",
      script: "",
      text: "",
      regExp: false,
      context: "",
      driver: null,
      field: null,
      anyBlock: null,
      matchAll: false,
      invert: null,
      normalize: false,
    },
  })

  const createMutation = useMutation({
    mutationFn: api.rule.create,
    onSuccess(rule) {
      queryClient.invalidateQueries({ queryKey: [GLOBAL_QUERIES.POLICY_LIST] })
      queryClient.invalidateQueries({ queryKey: [QUERIES.RULE_DETAIL, policy.id] })

      form.reset()

      close()

      toast.success({
        title: t("success"),
        description: t("ruleHasBeenSuccessfullyCreated", {
          ruleName: rule?.name,
        }),
      })

      navigate(`/app/compliance/config/${policy.id}/${rule.id}`)
    },
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const title = formStep === FormStep.Type ? t("chooseRuleType") : t("addRule")

  function submit(values: RuleForm) {
    console.log(values)
    const payload: CreateOrUpdateRule = {
      id: null,
      name: values.name,
      type,
      script: values.script,
      policy: policy.id,
      enabled: true,
      text: values.text,
      regExp: values.regExp,
      context: values.context,
      driver: values.driver,
      field: values.field,
      anyBlock: stringToBoolean(values.anyBlock),
      matchAll: values.matchAll,
      invert: stringToBoolean(values.invert),
      normalize: values.normalize,
    }

    createMutation.mutate(payload)
  }

  function next() {
    setFormStep(FormStep.Details)

    dialogConfig.update({
      variant: type === RuleType.Text ? null : "full-floating",
      size: "lg",
    })

    if (type === RuleType.Javascript || type === RuleType.Python) {
      form.setValue("script", RULE_SCRIPT_TEMPLATE[type])
    }
  }

  function previous() {
    setFormStep(FormStep.Type)

    dialogConfig.update({
      variant: null,
      size: "xl",
    })
  }

  function close() {
    dialogConfig.close()

    setTimeout(() => {
      setType(null)
      setFormStep(FormStep.Type)

      dialogConfig.update({
        variant: type === RuleType.Text ? null : "full-floating",
        size: "lg",
      })
    }, 500)
  }

  useEffect(() => {
    form.reset()
  }, [form])

  const typeOptions = [
    {
      icon: "alignLeft",
      type: RuleType.Text,
      label: t("text"),
      description: t("createARuleUsingStringAndRegexp"),
    },
    {
      icon: "javascript",
      type: RuleType.Javascript,
      label: t("javascript"),
      description: t("createARuleUsingJavascript"),
    },
    {
      icon: "python",
      type: RuleType.Python,
      label: t("python"),
      description: t("createARuleUsingPython"),
    },
  ]

  form.watch((values) => {
    if (type === RuleType.Text) return

    if (values.script?.length === 0) {
      form.setError("script", {
        message: t("thisFieldIsRequired"),
      })
    }
  })

  return (
    <FormProvider {...form}>
      <Dialog.Root
        open={dialogConfig.props.isOpen}
        placement="center"
        motionPreset="slide-in-bottom"
        size={dialogConfig.props.size}
        variant={dialogConfig.props.variant}
        closeOnInteractOutside={false}
        scrollBehavior="inside"
        onOpenChange={(e) => {
          if (!e.open) {
            dialogConfig.close()
          }
        }}
        onExitComplete={() => {
          if (dialogConfig.props?.onCancel) dialogConfig.props.onCancel()
          dialogConfig.remove()
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content as="form" onSubmit={form.handleSubmit(submit)}>
              <Dialog.Header display="flex" justifyContent="space-between">
                <Heading as="h3" fontSize="2xl" fontWeight="semibold">
                  {title}
                </Heading>

                <Text fontSize="md" color="grey.400">
                  {t("stepXofY", { step: formStep === FormStep.Type ? 1 : 2, total: 2 })}
                </Text>
              </Dialog.Header>
              <Dialog.Body flex="1" display="flex">
                {formStep === FormStep.Type ? (
                  <Stack direction="row" gap="5">
                    {typeOptions.map((option) => (
                      <BoxWithIconButton
                        icon={option.icon}
                        title={option.label}
                        description={option.description}
                        isActive={option.type === type}
                        onClick={() => setType(option.type)}
                        key={option.label}
                      />
                    ))}
                  </Stack>
                ) : (
                  <>
                    {type === RuleType.Text ? (
                      <RuleEditForm flex="1" type={type} />
                    ) : (
                      <RuleEditScript type={type} />
                    )}
                  </>
                )}
              </Dialog.Body>
              <Dialog.Footer justifyContent="space-between">
                {formStep === FormStep.Details && (
                  <Button onClick={previous}>{t("previous")}</Button>
                )}
                <Stack direction="row" gap="3" flex="1" justifyContent="end">
                  <Button onClick={close}>{t("cancel")}</Button>
                  {formStep === FormStep.Type && (
                    <Button variant="primary" disabled={type === null} onClick={next}>
                      {t("next")}
                    </Button>
                  )}

                  {formStep === FormStep.Details && (
                    <Button
                      type="submit"
                      disabled={!form.formState.isValid}
                      loading={createMutation.isPending}
                      variant="primary"
                    >
                      {t("create")}
                    </Button>
                  )}
                </Stack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </FormProvider>
  )
}

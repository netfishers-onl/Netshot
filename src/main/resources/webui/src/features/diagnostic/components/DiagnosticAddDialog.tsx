import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { BoxWithIconButton } from "@/components"
import { useDialogConfig } from "@/dialog"
import { useToast } from "@/hooks"
import { DiagnosticType } from "@/types"
import { Button, CloseButton, Dialog, Heading, Portal, Stack, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { QUERIES, SCRIPT_TEMPLATES } from "../constants"
import { Form } from "../types"
import { DiagnosticEditForm } from "./DiagnosticEditForm"
import DiagnosticEditScript from "./DiagnosticEditScript"

enum FormStep {
  Type,
  Details,
}

export default function DiagnosticAddDialog() {
  const { t } = useTranslation()
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [type, setType] = useState(DiagnosticType.Simple)
  const [formStep, setFormStep] = useState(FormStep.Type)
  const dialogConfig = useDialogConfig()

  const typeOptions = [
    {
      icon: "alignLeft",
      type: DiagnosticType.Simple,
      label: t("simple"),
      description: t("createADiagnosticUsingStringAndRegex"),
    },
    {
      icon: "javascript",
      type: DiagnosticType.Javascript,
      label: t("javascript"),
      description: t("createADiagnosticUsingJavascript"),
    },
    {
      icon: "python",
      type: DiagnosticType.Python,
      label: t("python"),
      description: t("createADiagnosticUsingPython"),
    },
  ]

  const form = useForm<Form>({
    defaultValues: {
      name: "",
      resultType: null,
      targetGroup: null,
      deviceDriver: null,
      cliMode: null,
      command: "",
      modifierPattern: "",
      modifierReplacement: "",
      script: "",
    },
  })

  const createMutation = useMutation({
    mutationFn: api.diagnostic.create,
    async onSuccess(diagnostic) {
      close()

      await queryClient.invalidateQueries({ queryKey: [QUERIES.DIAGNOSTIC_LIST] })

      form.reset()

      navigate(`/app/diagnostics/${diagnostic.id}`)

      toast.success({
        title: t("success"),
        description: t("diagnosticHasBeenSuccessfullyCreated", {
          diagnosticName: diagnostic?.name,
        }),
      })
    },
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  function submit(values: Form) {
    return createMutation.mutate({
      enabled: true,
      script: values.script,
      type,
      name: values.name,
      resultType: values.resultType,
      targetGroup: values.targetGroup ? values.targetGroup?.toString() : "-1",
      deviceDriver: values.deviceDriver,
      cliMode: values.cliMode,
      command: values.command,
      modifierPattern: values.modifierPattern,
      modifierReplacement: values.modifierReplacement,
    })
  }

  function next() {
    setFormStep(FormStep.Details)

    dialogConfig.update({
      variant: type === DiagnosticType.Simple ? null : "full-floating",
      size: "lg",
    })

    if ([DiagnosticType.Javascript, DiagnosticType.Python].includes(type)) {
      form.setValue("script", SCRIPT_TEMPLATES[type])
    }
  }

  function previous() {
    setFormStep(FormStep.Type)

    dialogConfig.update({
      variant: null,
      size: "xl",
    })

    form.reset()
  }

  function close() {
    dialogConfig.close()

    setTimeout(() => {
      setType(DiagnosticType.Simple)
      setFormStep(FormStep.Type)

      dialogConfig.update({
        variant: null,
        size: "xl",
      })

      form.reset()
    }, 500)
  }

  form.watch((values) => {
    if (type === DiagnosticType.Simple) return

    if (values.script?.length === 0) {
      form.setError("script", {
        message: t("thisFieldIsRequired"),
      })
    }
  })

  return (
    <FormProvider {...form}>
      <Dialog.Root
        preventScroll={false}
        placement="center"
        open={dialogConfig.props.isOpen}
        size={dialogConfig.props.size}
        variant={dialogConfig.props.variant}
        closeOnInteractOutside={false}
        scrollBehavior="inside"
        onOpenChange={(e) => {
          if (!e.open) {
            close()
          }
        }}
        onExitComplete={() => {
          dialogConfig.remove()
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content as="form" onSubmit={form.handleSubmit(submit)}>
              <Dialog.Header display="flex" justifyContent="space-between">
                <Heading as="h3" fontSize="2xl" fontWeight="semibold">
                  {formStep === FormStep.Type ? t("chooseDiagnosticType") : t("addDiagnostic")}
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
                    {type === DiagnosticType.Simple ? (
                      <DiagnosticEditForm flex="1" type={type} />
                    ) : (
                      <DiagnosticEditScript type={type} />
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
          <Dialog.CloseTrigger asChild>
            <CloseButton size="sm" variant="outline" />
          </Dialog.CloseTrigger>
        </Portal>
      </Dialog.Root>
    </FormProvider>
  )
}

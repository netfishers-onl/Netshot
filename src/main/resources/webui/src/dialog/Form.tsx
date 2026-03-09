import { Button, ButtonProps, CloseButton, Dialog, Portal, Stack } from "@chakra-ui/react"
import mergeWith from "lodash.mergewith"
import { FieldValues, FormProvider, UseFormReturn, useFormState } from "react-hook-form"
import { useDialogConfig } from "./dialogConfigContext"
import { useDialogProviderConfig } from "./DialogProvider"
import { useDialogStore } from "./store"
import { BaseDialogProps, PromiseOrVoid } from "./types"

export type FormDialogProps<F extends FieldValues = FieldValues> = {
  onSubmit(data: F): PromiseOrVoid
  form: UseFormReturn<F>
  submitButton?: {
    label?: string
    props?: ButtonProps
  }
  cancelButton?: {
    label?: string
    props?: ButtonProps
  }
} & BaseDialogProps

export default function FormDialog<F extends FieldValues = FieldValues>() {
  const providerConfig = useDialogProviderConfig()
  const config = useDialogConfig<FormDialogProps<F>>()
  const currentConfig = useDialogStore((state) => state.configs.find((c) => c.id === config.id))
  const formState = useFormState({ control: config.props.form.control })
  const { submitButton, cancelButton } = mergeWith({}, providerConfig.form, config.props)

  const submitButtonConfig: FormDialogProps["submitButton"] = {
    label: submitButton?.label,
    props: {
      type: "submit",
      variant: "primary",
      disabled: !formState?.isValid,
      loading: config.props.isLoading,
      autoFocus: true,
      ...submitButton?.props,
    },
  }

  const cancelButtonConfig: FormDialogProps["cancelButton"] = {
    label: cancelButton?.label,
    props: {
      variant: "default",
      disabled: currentConfig.props.isLoading,
      onClick: (evt: React.MouseEvent<HTMLButtonElement>) => {
        evt?.stopPropagation()
        if (config.props.onCancel) config.props.onCancel()
        config.close()
      },
      ...cancelButton?.props,
    },
  }

  return (
    <FormProvider {...config.props.form}>
      <Dialog.Root
        open={config.props.isOpen}
        placement="center"
        motionPreset="slide-in-bottom"
        size={config.props.size}
        variant={config.props.variant}
        scrollBehavior="inside"
        preventScroll={false}
        closeOnInteractOutside={false}
        onOpenChange={(e) => {
          if (!e.open) {
            config.close()
          }
        }}
        onExitComplete={() => {
          config.remove()
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content
              as="form"
              onSubmit={config.props.form.handleSubmit(config.props.onSubmit)}
            >
              <Dialog.Header as="h3" fontSize="2xl" fontWeight="semibold">
                {config.props.title}
                <Dialog.CloseTrigger />
              </Dialog.Header>
              <Dialog.Body>
                {typeof config.props.description === "function"
                  ? config.props.description()
                  : config.props.description}
              </Dialog.Body>
              <Dialog.Footer>
                <Stack direction="row" gap="3">
                  <Button {...cancelButtonConfig.props}>{cancelButtonConfig?.label}</Button>
                  <Button {...submitButtonConfig.props}>{submitButtonConfig?.label}</Button>
                </Stack>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" variant="outline" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </FormProvider>
  )
}

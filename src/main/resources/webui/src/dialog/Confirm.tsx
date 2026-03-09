import { Button, ButtonProps, CloseButton, Dialog, Portal, Stack, Text } from "@chakra-ui/react"
import mergeWith from "lodash.mergewith"
import { isValidElement } from "react"
import { useDialogConfig } from "./dialogConfigContext"
import { useDialogProviderConfig } from "./DialogProvider"
import { useDialogStore } from "./store"
import { BaseDialogProps, PromiseOrVoid } from "./types"

export type ConfirmDialogProps = {
  onConfirm(): PromiseOrVoid
  confirmButton?: {
    label?: string
    props?: ButtonProps
  }
  cancelButton?: {
    label?: string
    props?: ButtonProps
  }
} & BaseDialogProps

export default function ConfirmDialog() {
  const providerConfig = useDialogProviderConfig()
  const config = useDialogConfig<ConfirmDialogProps>()
  const currentConfig = useDialogStore((state) => state.configs.find((c) => c.id === config.id))
  const isTitleComponent = isValidElement(config?.props?.title)
  const isDescriptionComponent = isValidElement(config?.props?.description)
  const { confirmButton, cancelButton } = mergeWith({}, providerConfig.confirm, config.props)

  const confirmButtonConfig: ConfirmDialogProps["confirmButton"] = {
    label: confirmButton?.label,
    props: {
      variant: "primary",
      loading: currentConfig.props.isLoading,
      onClick: (evt: React.MouseEvent<HTMLButtonElement>) => {
        evt?.stopPropagation()
        if (config.props.onConfirm) config.props.onConfirm()
      },
      ...confirmButton?.props,
    },
  }

  const cancelButtonConfig: ConfirmDialogProps["cancelButton"] = {
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
    <Dialog.Root
      open={config.props.isOpen}
      placement="center"
      motionPreset="slide-in-bottom"
      size={config.props.size}
      closeOnInteractOutside={false}
      onOpenChange={(e) => {
        if (!e.open) {
          config.close()
        }
      }}
      onExitComplete={() => {
        if (config.props.onCancel) config.props.onCancel()
        config.remove()
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            {isTitleComponent ? (
              <>{config.props.title}</>
            ) : (
              <Dialog.Header as="h3" fontSize="2xl" fontWeight="semibold">
                {config.props.title}
              </Dialog.Header>
            )}
            <Dialog.Body>
              {isDescriptionComponent ? (
                <>{config.props.description}</>
              ) : (
                <Text>{config.props.description as string}</Text>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Stack direction="row" gap="3">
                <Button {...cancelButtonConfig?.props}>{cancelButtonConfig?.label}</Button>
                <Button {...confirmButtonConfig?.props}>{confirmButtonConfig?.label}</Button>
              </Stack>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" variant="outline" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

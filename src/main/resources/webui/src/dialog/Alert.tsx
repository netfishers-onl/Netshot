import {
  Button,
  ButtonProps,
  CloseButton,
  Dialog,
  Heading,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react"
import mergeWith from "lodash.mergewith"
import { isValidElement } from "react"
import { useDialogConfig } from "./dialogConfigContext"
import { useDialogProviderConfig } from "./DialogProvider"
import { useDialogStore } from "./store"
import { BaseDialogProps } from "./types"

export type AlertDialogProps = {
  closeButton?: {
    label?: string
    props?: ButtonProps
  }
} & BaseDialogProps

export default function AlertDialog() {
  const providerConfig = useDialogProviderConfig()
  const config = useDialogConfig<AlertDialogProps>()
  const currentConfig = useDialogStore((state) => state.configs.find((c) => c.id === config.id))
  const isTitleComponent = isValidElement(config?.props?.title)
  const isDescriptionComponent = isValidElement(config?.props?.description)
  const { closeButton } = mergeWith({}, providerConfig.alert, config.props)

  const closeButtonConfig: AlertDialogProps["closeButton"] = {
    label: closeButton?.label,
    props: {
      variant: "primary",
      loading: currentConfig.props.isLoading,
      onClick: (evt: React.MouseEvent<HTMLButtonElement>) => {
        evt?.stopPropagation()
        if (config.props?.onCancel) config.props?.onCancel()
        config.close()
      },
      ...closeButton?.props,
    },
  }

  return (
    <Dialog.Root
      open={config.props.isOpen}
      placement="center"
      motionPreset="slide-in-bottom"
      size={config.props.size}
      variant={config.props.variant}
      closeOnInteractOutside={false}
      scrollBehavior="inside"
      onOpenChange={(e) => {
        if (!e.open) {
          config.close()
        }
      }}
      onExitComplete={() => {
        if (config.props?.onCancel) config.props.onCancel()
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
              <Dialog.Header>
                <Heading as="h3" fontSize="2xl" fontWeight="semibold">
                  {config.props.title}
                </Heading>
              </Dialog.Header>
            )}
            <Dialog.Body>
              {isDescriptionComponent ? (
                <>{config.props.description}</>
              ) : (
                <Text>{config.props.description as string}</Text>
              )}
            </Dialog.Body>
            {!config.props.hideFooter && (
              <Dialog.Footer>
                <Stack direction="row" gap="3">
                  <Button {...closeButtonConfig?.props}>{closeButtonConfig?.label}</Button>
                </Stack>
              </Dialog.Footer>
            )}
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" variant="outline" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

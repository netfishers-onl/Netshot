import { Dialog, Portal, Spinner, Stack, Text } from "@chakra-ui/react"
import { isValidElement } from "react"
import { useDialogConfig } from "./dialogConfigContext"
import { BaseDialogProps, PromiseOrVoid } from "./types"

export type LoadingDialogProps = {
  onComplete?(): PromiseOrVoid
} & Omit<BaseDialogProps, "onCancel" | "isLoading">

export default function LoadingDialog() {
  const config = useDialogConfig<LoadingDialogProps>()
  const isTitleComponent = isValidElement(config?.props?.title)
  const isDescriptionComponent = isValidElement(config?.props?.description)

  return (
    <Dialog.Root
      open={config.props.isOpen}
      placement="center"
      motionPreset="slide-in-bottom"
      closeOnInteractOutside={false}
      onOpenChange={(e) => {
        if (!e.open) {
          config.close()
        }
      }}
      onExitComplete={() => {
        if (config.props.onComplete) config.props.onComplete()
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
              <Stack direction="row" gap="4" alignItems="center" pb="5">
                <Spinner color="primary" />

                {isDescriptionComponent ? (
                  <>{config.props.description}</>
                ) : (
                  <Text>{config.props.description as string}</Text>
                )}
              </Stack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

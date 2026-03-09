import { MutationKey, QueryClient, useQueryClient } from "@tanstack/react-query"
import { FieldValues } from "react-hook-form"
import { AlertDialogProps } from "../Alert"
import { ConfirmDialogProps } from "../Confirm"
import { FormDialogProps } from "../Form"
import { useDialogStore } from "../store"
import { useAlertDialog, useConfirmDialog, useFormDialog } from "../useDialog"

export function syncDialogWithMutation(
  queryClient: QueryClient,
  dialogId: string,
  mutationKey: MutationKey
) {
  return queryClient.getMutationCache().subscribe((event) => {
    if (event.mutation?.options.mutationKey?.toString() !== mutationKey.toString()) return

    const isMutating = queryClient.isMutating({ mutationKey }) > 0

    useDialogStore.getState().update(dialogId, { isLoading: isMutating })
  })
}

export function useConfirmDialogWithMutation() {
  const dialog = useConfirmDialog()
  const queryClient = useQueryClient()

  return {
    open: (keys: MutationKey, props: ConfirmDialogProps) => {
      const handle = dialog.open(props)

      const unsub = syncDialogWithMutation(queryClient, handle.id, keys)

      handle.onClose(() => {
        unsub()
      })

      return handle
    },
  }
}

export function useAlertDialogWithMutation() {
  const dialog = useAlertDialog()
  const queryClient = useQueryClient()

  return {
    open: (keys: MutationKey, props: AlertDialogProps) => {
      const handle = dialog.open(props)

      const unsub = syncDialogWithMutation(queryClient, handle.id, keys)

      handle.onClose(() => {
        unsub()
      })

      return handle
    },
  }
}

export function useFormDialogWithMutation() {
  const dialog = useFormDialog()
  const queryClient = useQueryClient()

  return {
    open: <F extends FieldValues = FieldValues>(keys: MutationKey, props: FormDialogProps<F>) => {
      const handle = dialog.open(props)

      const unsub = syncDialogWithMutation(queryClient, handle.id, keys)

      handle.onClose(() => {
        unsub()
      })

      return handle
    },
  }
}

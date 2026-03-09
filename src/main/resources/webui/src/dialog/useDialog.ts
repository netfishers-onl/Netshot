import { FieldValues } from "react-hook-form"

import { DialogRootProps } from "@chakra-ui/react"
import { ReactNode } from "react"
import Alert, { AlertDialogProps } from "./Alert"
import Confirm, { ConfirmDialogProps } from "./Confirm"
import Form, { FormDialogProps } from "./Form"
import Loading, { LoadingDialogProps } from "./Loading"
import { useDialogStore } from "./store"

export function useConfirmDialog() {
  const open = useDialogStore((state) => state.open)

  return {
    open: (props: ConfirmDialogProps) => open(Confirm, props),
  }
}

export function useFormDialog() {
  const open = useDialogStore((state) => state.open)

  return {
    open: <F extends FieldValues = FieldValues>(props: FormDialogProps<F>) => open(Form<F>, props),
  }
}

export function useLoadingDialog() {
  const open = useDialogStore((state) => state.open)

  return {
    open: (props: LoadingDialogProps) => open(Loading, props),
  }
}

export function useAlertDialog() {
  const open = useDialogStore((state) => state.open)

  return {
    open: (props: AlertDialogProps) => open(Alert, props),
  }
}

export function useCustomDialog() {
  const open = useDialogStore((state) => state.open)

  return {
    open: (
      component: ReactNode,
      props: {
        isCentered?: boolean
        size?: DialogRootProps["size"]
        variant?: DialogRootProps["variant"]
      } = {}
    ) => open(() => component, { ...props }),
  }
}

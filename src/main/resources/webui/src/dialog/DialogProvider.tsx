import { ButtonProps } from "@chakra-ui/react"
import mergeWith from "lodash.mergewith"
import { createContext, memo, PropsWithChildren, use } from "react"
import { useShallow } from "zustand/react/shallow"
import { DialogConfigContext } from "./dialogConfigContext"
import { useDialogStore } from "./useDialogStore"

export type DialogProviderConfig = {
  form?: {
    submitButton?: {
      label?: string
      props?: ButtonProps
    }
    cancelButton?: {
      label?: string
      props?: ButtonProps
    }
  }
  confirm?: {
    confirmButton?: {
      label?: string
      props?: ButtonProps
    }
    cancelButton?: {
      label?: string
      props?: ButtonProps
    }
  }
  alert?: {
    closeButton?: {
      label?: string
      props?: ButtonProps
    }
  }
}

const DEFAULT_PROVDER_CONFIG: DialogProviderConfig = {
  form: {
    submitButton: {
      label: "submit",
      props: {
        colorPalette: "green",
      },
    },
    cancelButton: {
      label: "cancel",
    },
  },
  confirm: {
    confirmButton: {
      label: "confirm",
      props: {
        colorPalette: "green",
      },
    },
    cancelButton: {
      label: "cancel",
    },
  },
  alert: {
    closeButton: {
      label: "close",
    },
  },
}

const DialogProviderContext = createContext<DialogProviderConfig>(null)
export const useDialogProviderConfig = () => use(DialogProviderContext)

const DialogInstance = memo(({ configId }: { configId: string }) => {
  const config = useDialogStore((state) => state.configs.find((config) => config.id === configId))

  if (!config) return

  return (
    <DialogConfigContext value={config}>
      <config.component />
    </DialogConfigContext>
  )
})

export function DialogProvider({
  children,
  config = {},
}: PropsWithChildren<{ config?: DialogProviderConfig }>) {
  const configIds = useDialogStore(useShallow((state) => state.configs.map((config) => config.id)))

  return (
    <DialogProviderContext value={mergeWith({}, DEFAULT_PROVDER_CONFIG, config)}>
      {children}

      {configIds.map((id) => (
        <DialogInstance key={id} configId={id} />
      ))}
    </DialogProviderContext>
  )
}

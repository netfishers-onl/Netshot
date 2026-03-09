import { generateToken } from "@/utils"
import { ComponentProps, FunctionComponent } from "react"
import { create } from "zustand"
import { BaseDialogProps, DialogConfig } from "./types"

export type DialogStoreState = {
  configs: DialogConfig<BaseDialogProps>[]
  open<P extends BaseDialogProps, C extends FunctionComponent<P>>(
    component: C,
    props: ComponentProps<C>
  ): DialogConfig<BaseDialogProps>
  remove(id: string): void
  update<P extends BaseDialogProps, C extends FunctionComponent<P>>(
    id: string,
    props: ComponentProps<C>
  ): void
  listeners: Map<string, () => void>
}

export const useDialogStore = create<DialogStoreState>((set, get) => ({
  configs: [],
  listeners: new Map(),

  update: <P extends BaseDialogProps, C extends FunctionComponent<P>>(
    id: string,
    props: ComponentProps<C>
  ) => {
    set((state) => ({
      configs: state.configs.map((config) => {
        if (config.id === id) {
          return {
            ...config,
            props: {
              ...config.props,
              ...props,
            },
          }
        }

        return config
      }),
    }))
  },

  remove: (id: string) => {
    set((state) => ({
      configs: state.configs.filter((config) => config.id !== id),
    }))
  },

  open: <P extends BaseDialogProps, C extends FunctionComponent<P>>(
    component: C,
    props: ComponentProps<C>
  ) => {
    const id = generateToken()
    function update(updatedConfig: ComponentProps<C>) {
      get().update(id, updatedConfig)
    }

    function open() {
      get().update(id, {
        isOpen: true,
      })
    }

    function close() {
      get().update(id, {
        isOpen: false,
      })

      const listeners = get().listeners

      for (const [dialogId, listener] of listeners) {
        if (dialogId === id) {
          listener()
        }
      }
    }

    function remove() {
      get().remove(id)
    }

    function onClose(cb: () => void) {
      const listeners = get().listeners

      listeners.set(id, cb)

      set({ listeners })
    }

    const config: DialogConfig<BaseDialogProps> = {
      id,
      component,
      props: {
        isOpen: true,
        isLoading: false,
        ...props,
      },
      update,
      open,
      close,
      remove,
      onClose,
    }

    set((state) => ({
      configs: [...state.configs, config],
    }))

    return config
  },
}))

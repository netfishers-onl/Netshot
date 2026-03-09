import { createContext, useContext } from "react"
import { BaseDialogProps, DialogConfig } from "./types"

export const DialogConfigContext = createContext<DialogConfig>(null)

export const useDialogConfig = <P extends BaseDialogProps = BaseDialogProps>() =>
  useContext<DialogConfig<P>>(DialogConfigContext)

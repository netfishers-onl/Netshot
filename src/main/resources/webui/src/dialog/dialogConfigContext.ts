import { createContext, use } from "react"
import { BaseDialogProps, DialogConfig } from "./types"

export const DialogConfigContext = createContext<DialogConfig>(null)

export const useDialogConfig = <P extends BaseDialogProps = BaseDialogProps>() =>
  use<DialogConfig<P>>(DialogConfigContext)

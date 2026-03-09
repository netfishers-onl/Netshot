import { createOptionHook } from "@/hooks"
import { HookActionType } from "@/types"

export const useWebhookDataTypeOptions = createOptionHook([
  {
    label: "POST JSON",
    value: HookActionType.PostJSON,
  },
  {
    label: "POST XML",
    value: HookActionType.PostXML,
  },
])

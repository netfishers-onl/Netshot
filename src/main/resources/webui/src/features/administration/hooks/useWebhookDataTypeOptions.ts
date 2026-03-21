import { createOptionHook } from "@/hooks"
import { HookActionType } from "@/types"

export const useWebhookDataTypeOptions = createOptionHook([
  {
    label: "postJson",
    value: HookActionType.PostJSON,
  },
  {
    label: "postXml",
    value: HookActionType.PostXML,
  },
])

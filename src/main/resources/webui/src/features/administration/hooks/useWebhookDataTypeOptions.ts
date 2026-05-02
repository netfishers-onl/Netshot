import { createOptionHook } from "@/hooks"
import { HookActionType } from "@/types"

export const useWebhookDataTypeOptions = createOptionHook([
  {
    label: "webhook.postJson",
    value: HookActionType.PostJSON,
  },
  {
    label: "webhook.postXml",
    value: HookActionType.PostXML,
  },
])

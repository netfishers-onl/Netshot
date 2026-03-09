import { createOptionHook } from "@/hooks"
import { HookTriggerType, TaskType } from "@/types"

const options = [
  {
    label: "After snapshot",
    description: "Executed after device snapshot",
    value: {
      type: HookTriggerType.PostTask,
      item: TaskType.TakeSnapshot,
    },
  },
  {
    label: "After script",
    description: "Executed after JS script on device",
    value: {
      type: HookTriggerType.PostTask,
      item: TaskType.RunDeviceScript,
    },
  },
  {
    label: "After diagnostics",
    description: "Executed after diagnostics performed on device",
    value: {
      type: HookTriggerType.PostTask,
      item: TaskType.RunDiagnostic,
    },
  },
]

export const useWebhookTriggerOptions = createOptionHook(options, {
  translateFn(opt, t) {
    return {
      ...opt,
      label: t(opt.label),
      description: t(opt.description as string),
    }
  },
})

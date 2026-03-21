import { createOptionHook } from "@/hooks"
import { HookTriggerType, TaskType } from "@/types"

const options = [
  {
    label: "afterSnapshot",
    description: "executedAfterDeviceSnapshot",
    value: {
      type: HookTriggerType.PostTask,
      item: TaskType.TakeSnapshot,
    },
  },
  {
    label: "afterScript",
    description: "executedAfterJsScriptOnDevice",
    value: {
      type: HookTriggerType.PostTask,
      item: TaskType.RunDeviceScript,
    },
  },
  {
    label: "afterDiagnostics",
    description: "executedAfterDiagnosticsPerformedOnDevice",
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

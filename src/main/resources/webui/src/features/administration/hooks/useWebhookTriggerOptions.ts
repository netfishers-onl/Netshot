import { createOptionHook } from "@/hooks"
import { HookTriggerType, TaskType } from "@/types"

const options = [
  {
    label: "device.snapshot.after",
    description: "policy.rule.executedAfterSnapshot",
    value: {
      type: HookTriggerType.PostTask,
      item: TaskType.TakeSnapshot,
    },
  },
  {
    label: "task.afterScript",
    description: "policy.rule.executedAfterJsScript",
    value: {
      type: HookTriggerType.PostTask,
      item: TaskType.RunDeviceScript,
    },
  },
  {
    label: "task.afterDiagnostics",
    description: "policy.rule.executedAfterDiagnostics",
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

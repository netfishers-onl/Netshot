import { createOptionHook } from "@/hooks"
import { DiagnosticResultType } from "@/types"

export const useResultTypeOptions = createOptionHook([
  {
    label: "text",
    value: DiagnosticResultType.Text,
  },
  {
    label: "numeric",
    value: DiagnosticResultType.Numeric,
  },
  {
    label: "binary",
    value: DiagnosticResultType.Binary,
  },
])

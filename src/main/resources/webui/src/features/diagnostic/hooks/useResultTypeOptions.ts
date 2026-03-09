import { createOptionHook } from "@/hooks"
import { DiagnosticResultType } from "@/types"

export const useResultTypeOptions = createOptionHook([
  {
    label: "Text",
    value: DiagnosticResultType.Text,
  },
  {
    label: "Numeric",
    value: DiagnosticResultType.Numeric,
  },
  {
    label: "Binary",
    value: DiagnosticResultType.Binary,
  },
])

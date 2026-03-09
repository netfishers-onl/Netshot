import { createOptionHook } from "@/hooks"
import { AttributeGroupType } from "./types"

export const useAttributeGroupOptions = createOptionHook([
  {
    label: "Generic attributes",
    value: AttributeGroupType.Generic,
  },
  {
    label: "Type-specific attributes",
    value: AttributeGroupType.TypeSpecific,
  },
  {
    label: "Compliance rule results",
    value: AttributeGroupType.ComplianceRuleResult,
  },
  {
    label: "Diagnostic results",
    value: AttributeGroupType.DiagnosticResult,
  },
])

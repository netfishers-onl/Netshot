import { createOptionHook } from "@/hooks"
import { ExportMimeType } from "../types"

export const useExportMimesTypesOptions = createOptionHook([
  {
    label: "xls",
    value: ExportMimeType.Xls,
  },
])

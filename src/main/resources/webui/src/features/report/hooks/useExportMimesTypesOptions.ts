import { createOptionHook } from "@/hooks"
import { ExportMimeType } from "../types"

export const useExportMimesTypesOptions = createOptionHook([
  {
    label: "Microsoft Excel (xlsx)",
    value: ExportMimeType.Xlsx,
  },
])

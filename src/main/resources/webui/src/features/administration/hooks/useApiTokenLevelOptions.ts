import { createOptionHook } from "@/hooks"
import { ApiTokenPermissionLevel } from "@/types"

export const useApiTokenLevelOptions = createOptionHook([
  {
    label: "readOnly",
    value: ApiTokenPermissionLevel.ReadOnly,
  },
  {
    label: "readWrite",
    value: ApiTokenPermissionLevel.ReadWrite,
  },
  {
    label: "readWriteCommandsOnDevices",
    value: ApiTokenPermissionLevel.ReadWriteCommandOnDevice,
  },
  {
    label: "admin",
    value: ApiTokenPermissionLevel.Admin,
  },
])

import { createOptionHook } from "@/hooks"
import { ApiTokenPermissionLevel } from "@/types"

export const useApiTokenLevelOptions = createOptionHook([
  {
    label: "Read only",
    value: ApiTokenPermissionLevel.ReadOnly,
  },
  {
    label: "Read-write",
    value: ApiTokenPermissionLevel.ReadWrite,
  },
  {
    label: "Read-write & commands on devices",
    value: ApiTokenPermissionLevel.ReadWriteCommandOnDevice,
  },
  {
    label: "Admin",
    value: ApiTokenPermissionLevel.Admin,
  },
])

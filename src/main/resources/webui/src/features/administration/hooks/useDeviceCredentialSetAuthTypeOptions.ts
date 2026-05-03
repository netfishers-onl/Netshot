import { createOptionHook } from "@/hooks"
import { HashingAlgorithm } from "@/types"

export const useDeviceCredentialSetAuthTypeOptions = createOptionHook([
  {
    label: HashingAlgorithm.MD5,
    value: HashingAlgorithm.MD5,
  },
  {
    label: HashingAlgorithm.SHA,
    value: HashingAlgorithm.SHA,
  },
])

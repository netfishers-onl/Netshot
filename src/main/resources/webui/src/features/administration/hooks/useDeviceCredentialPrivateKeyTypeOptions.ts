import { createOptionHook } from "@/hooks"
import { HashingAlgorithm } from "@/types"

export const useDeviceCredentialPrivateKeyTypeOptions = createOptionHook([
  {
    label: HashingAlgorithm.DES,
    value: HashingAlgorithm.DES,
  },
  {
    label: HashingAlgorithm.AES128,
    value: HashingAlgorithm.AES128,
  },
  {
    label: HashingAlgorithm.AES192,
    value: HashingAlgorithm.AES192,
  },
  {
    label: HashingAlgorithm.AES256,
    value: HashingAlgorithm.AES256,
  },
])

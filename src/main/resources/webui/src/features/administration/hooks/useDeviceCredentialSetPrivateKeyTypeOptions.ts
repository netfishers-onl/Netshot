import { createOptionHook } from "@/hooks"
import { HashingAlgorithm } from "@/types"

export const useDeviceCredentialSetPrivateKeyTypeOptions = createOptionHook([
  {
    label: "network.noPrivacy",
    value: HashingAlgorithm.NONE,
  },
  {
    label: "network.des",
    value: HashingAlgorithm.DES,
  },
  {
    label: "network.des3",
    value: HashingAlgorithm.DES3,
  },
  {
    label: "network.aes128",
    value: HashingAlgorithm.AES128,
  },
  {
    label: "network.aes192",
    value: HashingAlgorithm.AES192,
  },
  {
    label: "network.aes256",
    value: HashingAlgorithm.AES256,
  },
])

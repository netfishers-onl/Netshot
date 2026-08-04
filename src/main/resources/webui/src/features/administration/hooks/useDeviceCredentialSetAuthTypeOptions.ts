import { createOptionHook } from "@/hooks"
import { HashingAlgorithm } from "@/types"

export const useDeviceCredentialSetAuthTypeOptions = createOptionHook([
  {
    label: "network.noAuthentication",
    value: HashingAlgorithm.NONE,
  },
  {
    label: "network.md5",
    value: HashingAlgorithm.MD5,
  },
  {
    label: "network.sha",
    value: HashingAlgorithm.SHA,
  },
  {
    label: "network.sha224",
    value: HashingAlgorithm.HMAC128SHA224,
  },
  {
    label: "network.sha256",
    value: HashingAlgorithm.HMAC192SHA256,
  },
  {
    label: "network.sha384",
    value: HashingAlgorithm.HMAC256SHA384,
  },
  {
    label: "network.sha512",
    value: HashingAlgorithm.HMAC384SHA512,
  },
])

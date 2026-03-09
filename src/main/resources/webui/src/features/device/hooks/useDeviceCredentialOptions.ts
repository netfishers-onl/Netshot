import { createOptionHook } from "@/hooks"
import { CredentialSetType } from "@/types"

export const useDeviceCredentialOptions = createOptionHook([
  {
    label: "Use global credential sets for authentication",
    value: CredentialSetType.GLOBAL,
  },
  {
    label: "Specific SSH account",
    value: CredentialSetType.SSH,
  },
  {
    label: "Specific SSH key",
    value: CredentialSetType.SSHKey,
  },
  {
    label: "Specific Telnet account",
    value: CredentialSetType.Telnet,
  },
])

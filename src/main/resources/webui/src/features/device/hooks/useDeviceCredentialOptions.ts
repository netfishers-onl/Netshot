import { createOptionHook } from "@/hooks"
import { CredentialSetType } from "@/types"

export const useDeviceCredentialOptions = createOptionHook([
  {
    label: "useGlobalCredentialSetsForAuthentication",
    value: CredentialSetType.GLOBAL,
  },
  {
    label: "specificSshAccount",
    value: CredentialSetType.SSH,
  },
  {
    label: "specificSshKey",
    value: CredentialSetType.SSHKey,
  },
  {
    label: "specificTelnetAccount",
    value: CredentialSetType.Telnet,
  },
])

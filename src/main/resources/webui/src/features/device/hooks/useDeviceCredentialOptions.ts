import { createOptionHook } from "@/hooks"
import { CredentialSetType } from "@/types"

export const useDeviceCredentialOptions = createOptionHook([
  {
    label: "device.useGlobalCredentials",
    value: CredentialSetType.GLOBAL,
  },
  {
    label: "credential.specificSshAccount",
    value: CredentialSetType.SSH,
  },
  {
    label: "credential.specificSshKey",
    value: CredentialSetType.SSHKey,
  },
  {
    label: "credential.specificTelnetAccount",
    value: CredentialSetType.Telnet,
  },
])

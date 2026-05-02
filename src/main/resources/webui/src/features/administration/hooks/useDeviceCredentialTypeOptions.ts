import { createOptionHook } from "@/hooks"
import { CredentialSetType } from "@/types"

export const useDeviceCredentialTypeOptions = createOptionHook([
  {
    label: "network.snmpV1",
    value: CredentialSetType.SNMP_V1,
  },
  {
    label: "network.snmpV2c",
    value: CredentialSetType.SNMP_V2C,
  },
  {
    label: "network.snmpV3",
    value: CredentialSetType.SNMP_V3,
  },
  {
    label: "network.ssh",
    value: CredentialSetType.SSH,
  },
  {
    label: "network.sshKey",
    value: CredentialSetType.SSHKey,
  },
  {
    label: "network.telnet",
    value: CredentialSetType.Telnet,
  },
])

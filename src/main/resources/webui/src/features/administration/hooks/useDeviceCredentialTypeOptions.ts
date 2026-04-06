import { createOptionHook } from "@/hooks"
import { CredentialSetType } from "@/types"

export const useDeviceCredentialTypeOptions = createOptionHook([
  {
    label: "snmpV1",
    value: CredentialSetType.SNMP_V1,
  },
  {
    label: "snmpV2c",
    value: CredentialSetType.SNMP_V2C,
  },
  {
    label: "snmpV3",
    value: CredentialSetType.SNMP_V3,
  },
  {
    label: "ssh",
    value: CredentialSetType.SSH,
  },
  {
    label: "sshKey",
    value: CredentialSetType.SSHKey,
  },
  {
    label: "telnet",
    value: CredentialSetType.Telnet,
  },
])

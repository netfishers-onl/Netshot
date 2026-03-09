import { createOptionHook } from "@/hooks"
import { CredentialSetType } from "@/types"

export const useDeviceCredentialTypeOptions = createOptionHook([
  {
    label: CredentialSetType.SNMP_V1,
    value: CredentialSetType.SNMP_V1,
  },
  // @todo: A valider avec Sylvain, l'existance de ce type
  {
    label: CredentialSetType.SNMP_V2,
    value: CredentialSetType.SNMP_V2,
  },
  {
    label: CredentialSetType.SNMP_V2C,
    value: CredentialSetType.SNMP_V2C,
  },
  {
    label: CredentialSetType.SNMP_V3,
    value: CredentialSetType.SNMP_V3,
  },
  {
    label: CredentialSetType.SSH,
    value: CredentialSetType.SSH,
  },
  {
    label: CredentialSetType.SSHKey,
    value: CredentialSetType.SSHKey,
  },
  {
    label: CredentialSetType.Telnet,
    value: CredentialSetType.Telnet,
  },
])

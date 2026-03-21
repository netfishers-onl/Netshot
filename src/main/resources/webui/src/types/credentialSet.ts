import { HashingAlgorithm } from "./hashingAlgorithm"
import { MgmtDomain } from "./mgmtDomain"

export enum CredentialSetType {
  GLOBAL = "global",
  SNMP_V1 = "snmpV1",
  SNMP_V2 = "snmpV2",
  SNMP_V2C = "snmpV2c",
  SNMP_V3 = "snmpV3",
  SSH = "ssh",
  SSHKey = "sshKey",
  Telnet = "telnet",
}

export type CredentialSet = {
  id: number
  name: string
  mgmtDomain: MgmtDomain
  deviceSpecific: boolean
  type: CredentialSetType
  password: string
  superPassword: string
  username: string
  publicKey: string
  privateKey: string
  community: string
  privType: HashingAlgorithm
  authType: HashingAlgorithm
  privKey: string
  authKey: string
}

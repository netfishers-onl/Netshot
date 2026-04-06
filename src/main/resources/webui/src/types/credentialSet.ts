import { HashingAlgorithm } from "./hashingAlgorithm"
import { MgmtDomain } from "./mgmtDomain"

export enum CredentialSetType {
  GLOBAL = "global",
  SNMP_V1 = "SNMP v1",
  SNMP_V2C = "SNMP v2",
  SNMP_V3 = "SNMP v3",
  SSH = "SSH",
  SSHKey = "SSH Key",
  Telnet = "Telnet",
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
  privateKey: string
  community: string
  privType: HashingAlgorithm
  authType: HashingAlgorithm
  privKey: string
  authKey: string
}

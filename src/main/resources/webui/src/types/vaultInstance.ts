import { HttpsCaTrustMode } from "./device"

export enum VaultInstanceType {
  HashicorpKv2 = "Vault KV v2",
}

export enum VaultAuthMethod {
  AppRole = "APPROLE",
  Jwt = "JWT",
}

export type VaultInstance = {
  id: number
  name: string
  type: VaultInstanceType
  baseUrl: string
  namespace?: string
  httpsCaTrustMode: HttpsCaTrustMode
  httpsCustomCaCertificate?: string
  kvMountPath: string
  authMethod: VaultAuthMethod
  appRoleMountPath?: string
  appRoleId?: string
  appRoleSecretId?: string
  jwtMountPath?: string
  jwtIdpTokenEndpoint?: string
  jwtClientId?: string
  jwtClientSecret?: string
  jwtVaultRole?: string
  jwtScope?: string
}

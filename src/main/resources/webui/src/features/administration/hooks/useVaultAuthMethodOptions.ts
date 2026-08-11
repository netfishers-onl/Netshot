import { createOptionHook } from "@/hooks"
import { VaultAuthMethod } from "@/types"

export const useVaultAuthMethodOptions = createOptionHook([
  {
    label: "vault.authMethodAppRole",
    value: VaultAuthMethod.AppRole,
  },
  {
    label: "vault.authMethodJwt",
    value: VaultAuthMethod.Jwt,
  },
])

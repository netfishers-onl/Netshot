import { createOptionHook } from "@/hooks"
import { VaultInstanceType } from "@/types"

export const useVaultInstanceTypeOptions = createOptionHook([
  {
    label: "vault.typeVaultKv2",
    value: VaultInstanceType.HashicorpKv2,
  },
])

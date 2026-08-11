import api from "@/api"

export function fetchDomains() {
  return api.admin.getAllDomains({})
}

export function fetchVaultInstances() {
  return api.admin.getAllVaultInstances({})
}

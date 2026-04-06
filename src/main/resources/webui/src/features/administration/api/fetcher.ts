import api from "@/api"

export function fetchDomains() {
  return api.admin.getAllDomains({})
}

import api from "@/api"

export function fetchDomains() {
  return api.admin.getAllDomains({
    limit: 999,
    offset: 0,
  })
}

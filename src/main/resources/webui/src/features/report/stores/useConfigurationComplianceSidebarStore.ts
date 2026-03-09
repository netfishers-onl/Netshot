import { create } from "zustand"

export type UseConfigurationComplianceSidebarStoreState = {
  groups: number[]
  domains: number[]
  policies: number[]
  query: string
  setQuery(query: string): void
  setGroups(groups: number[]): void
  setDomains(domains: number[]): void
  setPolicies(policies: number[]): void
  setFilters(filters: { groups: number[]; domains: number[]; policies: number[] }): void
}

export const useConfigurationComplianceSidebarStore =
  create<UseConfigurationComplianceSidebarStoreState>((set) => ({
    groups: [],
    domains: [],
    policies: [],
    query: "",

    setQuery(query: string) {
      set({ query })
    },
    setGroups(groups: number[]) {
      set({ groups })
    },
    setDomains(domains: number[]) {
      set({ domains })
    },
    setPolicies(policies: number[]) {
      set({ policies })
    },
    setFilters({ groups, domains, policies }) {
      set({
        groups,
        policies,
        domains,
      })
    },
  }))

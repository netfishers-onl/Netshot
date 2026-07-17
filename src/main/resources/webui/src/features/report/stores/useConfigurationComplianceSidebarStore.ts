import { create } from "zustand"

export type UseConfigurationComplianceSidebarStoreState = {
  domains: number[]
  policies: number[]
  query: string
  setQuery(query: string): void
  setDomains(domains: number[]): void
  setPolicies(policies: number[]): void
  setFilters(filters: { domains: number[]; policies: number[] }): void
}

export const useConfigurationComplianceSidebarStore =
  create<UseConfigurationComplianceSidebarStoreState>((set) => ({
    domains: [],
    policies: [],
    query: "",

    setQuery(query: string) {
      set({ query })
    },
    setDomains(domains: number[]) {
      set({ domains })
    },
    setPolicies(policies: number[]) {
      set({ policies })
    },
    setFilters({ domains, policies }) {
      set({
        policies,
        domains,
      })
    },
  }))

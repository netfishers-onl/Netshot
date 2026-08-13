import api, {
  CreateOrUpdateRule,
  TestRuleScriptOnDevicePayload,
  TestRuleTextOnDevicePayload,
} from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS, QUERIES } from "@/constants"
import { useToast } from "@/hooks"
import { Rule } from "@/types"
import { getUniqueBy, sortAlphabetical } from "@/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERIES as FEATURE_QUERIES } from "../constants"

export function usePolicies() {
  return useQuery({
    queryKey: [QUERIES.POLICY_LIST],
    queryFn: () => api.policy.getAllWithRules(),
    select(policies) {
      return policies.map((policy) => ({
        ...policy,
        rules: policy.rules ? sortAlphabetical([...policy.rules], "name") : policy.rules,
      }))
    },
  })
}

// Fetches only the policies' own metadata (no rules), so opening a single
// policy doesn't trigger a rules fetch for every policy (that's what
// `getAllWithRules` does under the hood). The query key deliberately excludes
// policyId so switching between policies reuses the same cached list instead
// of issuing a new `GET /policies` per policy; staleTime is left open-ended
// since policy CRUD mutations already invalidate [QUERIES.POLICY_LIST].
export function usePolicy(policyId: number) {
  return useQuery({
    queryKey: [QUERIES.POLICY_LIST, "metadata"],
    queryFn: () => api.policy.getAll(),
    select(policies) {
      return policies.find((policy) => policy.id === policyId)
    },
    enabled: !!policyId,
    staleTime: Infinity,
  })
}

// Fetches the rules of a single policy, scoped by policyId so opening one
// policy doesn't refetch the rules of every other policy.
export function usePolicyRules(policyId: number) {
  return useQuery({
    queryKey: [FEATURE_QUERIES.POLICY_RULE_LIST, policyId],
    queryFn: () => api.rule.getAll(policyId),
    select(rules) {
      return sortAlphabetical([...rules], "name")
    },
    enabled: !!policyId,
  })
}

export function usePoliciesWithOptions() {
  return useQuery({
    queryKey: [QUERIES.POLICY_OPTION_LIST],
    queryFn: () => api.policy.getAllWithRules(),
    select(policies) {
      return sortAlphabetical(policies, "name").map((policy) => ({
        label: policy?.name,
        value: policy?.id,
      }))
    },
  })
}

export function usePoliciesWithSearch(query: string) {
  return useQuery({
    queryKey: [QUERIES.POLICY_SEARCH_LIST, query],
    queryFn: () => api.policy.getAllWithRules(query),
    select(res) {
      const formatted = getUniqueBy(res, "name")
      const sorted = sortAlphabetical(formatted, "name")
      return sorted.map((policy) => ({
        ...policy,
        rules: policy.rules ? sortAlphabetical([...policy.rules], "name") : policy.rules,
      }))
    },
  })
}

export function useRulesWithOptions(policyId: number) {
  return useQuery({
    queryKey: [QUERIES.RULE_OPTION_LIST, policyId],
    queryFn: async () => {
      return api.rule.getAll(policyId)
    },
    select(rules) {
      return rules.map((rule) => ({
        label: rule?.name,
        value: rule?.id,
      }))
    },
  })
}

export function useUpdateRule(rule: Rule, policyId: number) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: MUTATIONS.RULE_UPDATE,
    mutationFn: async (payload: CreateOrUpdateRule) => api.rule.update(rule.id, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: [QUERIES.POLICY_LIST],
      })
      queryClient.invalidateQueries({
        queryKey: [QUERIES.POLICY_SEARCH_LIST],
      })
      queryClient.invalidateQueries({
        queryKey: [FEATURE_QUERIES.RULE_DETAIL],
      })
      queryClient.invalidateQueries({
        queryKey: [FEATURE_QUERIES.POLICY_RULE_LIST, policyId],
      })
    },
  })
}

export function useTestRuleText() {
  const toast = useToast()

  return useMutation({
    mutationFn: async (payload: TestRuleTextOnDevicePayload) => api.rule.testText(payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })
}

export function useTestRuleScript() {
  const toast = useToast()

  return useMutation({
    mutationFn: async (payload: TestRuleScriptOnDevicePayload) => api.rule.testScript(payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })
}

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
import { useTranslation } from "react-i18next"
import { QUERIES as FEATURE_QUERIES } from "../constants"

export function usePolicies() {
  return useQuery({
    queryKey: [QUERIES.POLICY_LIST],
    queryFn: () => api.policy.getAllWithRules(),
  })
}

export function usePoliciesWithOptions() {
  return useQuery({
    queryKey: [QUERIES.POLICY_OPTION_LIST],
    queryFn: () => api.policy.getAllWithRules(),
    select(policies) {
      return policies.map((policy) => ({
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
      return sortAlphabetical(formatted, "name")
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

export function useUpdateRule(rule: Rule) {
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
        queryKey: [FEATURE_QUERIES.RULE_DETAIL],
      })
    },
  })
}

export function useTestRuleText() {
  const { t } = useTranslation()
  const toast = useToast()

  return useMutation({
    mutationFn: async (payload: TestRuleTextOnDevicePayload) => api.rule.testText(payload),
    onSuccess(res) {
      toast.script({
        title: t("Test result"),
        description: res.comment,
        meta: {
          result: res.result,
          error: res.scriptError,
        },
      })
    },
    onError(err: NetshotError) {
      toast.error(err)
    },
  })
}

export function useTestRuleScript() {
  const { t } = useTranslation()
  const toast = useToast()

  return useMutation({
    mutationFn: async (payload: TestRuleScriptOnDevicePayload) => api.rule.testScript(payload),
    onSuccess(res) {
      toast.script({
        title: t("Test result"),
        description: res.comment,
        meta: {
          result: res.result,
          error: res.scriptError,
        },
      })
    },
    onError(err: NetshotError) {
      toast.error(err)
    },
  })
}

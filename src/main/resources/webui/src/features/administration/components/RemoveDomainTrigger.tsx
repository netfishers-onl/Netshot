import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Domain } from "@/types"
import { Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MouseEvent, useCallback } from "react"
import { useTranslation } from "react-i18next"
import React from "react"
import Slot from "@/components/Slot"
import { QUERIES } from "../constants"

export type RemoveDomainTriggerProps = { domain: Domain; children: React.ReactElement<Record<string, unknown>> } & Record<string, unknown>

export default function RemoveDomainTrigger({ domain, children, ...rest }: RemoveDomainTriggerProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const toast = useToast()
  const dialog = useConfirmDialogWithMutation()

  const { mutateAsync } = useMutation({
    mutationKey: MUTATIONS.ADMIN_DOMAIN_REMOVE,
    mutationFn: async () => api.admin.removeDomain(domain?.id),
    onError(err: NetshotError) {
      console.log(err)
      toast.error(err)
    },
  })

  const open = useCallback(
    (evt: MouseEvent) => {
      evt?.stopPropagation()
      const dialogRef = dialog.open(MUTATIONS.ADMIN_DOMAIN_REMOVE, {
        title: t("domain.remove"),
        description: (
          <Text>
            {t("domain.aboutToRemove", {
              name: domain?.name,
            })}
          </Text>
        ),
        async onConfirm() {
          await mutateAsync()
          queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_DEVICE_DOMAINS] })
          dialogRef.close()
        },
        confirmButton: {
          label: t("common.remove"),
          props: {
            colorPalette: "red",
          },
        },
      })
    },
    [dialog, domain?.name, mutateAsync, queryClient, t]
  )

  return <Slot onTrigger={open} {...rest}>{children}</Slot>
}

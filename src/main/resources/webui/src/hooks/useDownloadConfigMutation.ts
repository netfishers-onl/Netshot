import { downloadFromUrl } from "@/utils"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import useToast from "./useToast"

export function useDownloadConfigMutation(configId: number, attributeName: string, filename?: string) {
  const { t } = useTranslation()
  const toast = useToast()

  return useMutation({
    mutationFn() {
      return downloadFromUrl(`/api/configs/${configId}/${attributeName}`, filename)
    },
    onError() {
      toast.error({
        title: t("common.downloadError"),
        description: t("common.anErrorOccurredDuringTheFileDownload"),
      })
    },
  })
}

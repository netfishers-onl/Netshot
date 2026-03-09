import { downloadFromUrl } from "@/utils"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import useToast from "./useToast"

export function useDownloadConfigMutation(configId: number, attributeName: string) {
  const { t } = useTranslation()
  const toast = useToast()

  return useMutation({
    mutationFn() {
      return downloadFromUrl(`/api/configs/${configId}/${attributeName}`)
    },
    onError() {
      toast.error({
        title: t("Download error"),
        description: t("An error occurred during the file download"),
      })
    },
  })
}

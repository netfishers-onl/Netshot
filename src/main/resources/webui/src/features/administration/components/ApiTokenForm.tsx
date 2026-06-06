import { FormControl } from "@/components"
import { LuCopy, LuRefreshCcw } from "react-icons/lu"
import { FormControlType } from "@/components/FormControl"
import { Select } from "@/components/Select"
import { Tooltip } from "@/components/ui/tooltip"
import { useToast, useUserLevelOptions } from "@/hooks"
import { generateToken } from "@/utils"
import { Alert, IconButton, Stack } from "@chakra-ui/react"
import { useCallback } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

export type ApiTokenForm = {
  description: string
  level: string
  token: string
}

export default function ApiTokenForm() {
  const form = useFormContext<ApiTokenForm>()
  const { t } = useTranslation()
  const toast = useToast()
  const userLevelOptions = useUserLevelOptions()

  const generate = useCallback(() => {
    form.setValue("token", generateToken())
  }, [form])

  const copy = useCallback(() => {
    const values = form.getValues()

    navigator.clipboard.writeText(values.token)

    toast.info({
      title: t("api.tokenCopied"),
      description: t("api.pleaseSaveSecurely"),
    })
  }, [form, toast])

  return (
    <Stack gap="6">
      <Stack direction="row" gap="5" alignItems="flex-end">
        <FormControl
          label={t("common.token")}
          control={form.control}
          name="token"
          fontFamily="mono"
          required
          suffix={
            <Tooltip content={t("common.copy")}>
              <IconButton
                aria-label={t("api.copyToken")}
                onClick={copy}
                variant="ghost"
                size="xs"
              >
                <LuCopy />
              </IconButton>
            </Tooltip>
          }
        />
        <IconButton aria-label={t("api.refreshToken")} onClick={generate}>
          <LuRefreshCcw />
        </IconButton>
      </Stack>
      <Alert.Root variant="warning">
        <Alert.Indicator />
        <Alert.Title>
          {t("api.pleaseCopyToken")}
        </Alert.Title>
      </Alert.Root>
      <FormControl
        label={t("common.description")}
        placeholder={t("common.eG", { example: t("api.descriptionPlaceholder") })}
        required
        control={form.control}
        name="description"
      />
      <Select
        required
        options={userLevelOptions.options}
        control={form.control}
        name="level"
        label={t("user.permissionLevel")}
      />
    </Stack>
  )
}

import { FormControl, Icon } from "@/components"
import { FormControlType } from "@/components/FormControl"
import { Select } from "@/components/Select"
import { Tooltip } from "@/components/ui/tooltip"
import { useToast } from "@/hooks"
import { generateToken } from "@/utils"
import { Alert, IconButton, Stack } from "@chakra-ui/react"
import { useCallback } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useApiTokenLevelOptions } from "../hooks"

export type ApiTokenForm = {
  description: string
  level: string
  token: string
}

export default function AdministrationApiTokenForm() {
  const form = useFormContext<ApiTokenForm>()
  const { t } = useTranslation()
  const toast = useToast()
  const apiTokenLevelOptions = useApiTokenLevelOptions()

  const generate = useCallback(() => {
    form.setValue("token", generateToken())
  }, [form])

  const copy = useCallback(() => {
    const values = form.getValues()

    navigator.clipboard.writeText(values.token)

    toast.info({
      title: t("tokenCopied"),
      description: t("pleaseDonTShareAndSaveItSecurely"),
    })
  }, [form, toast])

  return (
    <Stack gap="6">
      <Stack direction="row" gap="5" alignItems="flex-end">
        <FormControl
          label={t("token")}
          control={form.control}
          name="token"
          fontFamily="mono"
          required
          suffix={
            <Tooltip content={t("copy")}>
              <IconButton
                aria-label={t("copyToken")}
                onClick={copy}
                variant="ghost"
                colorPalette="grey"
              >
                <Icon name="copy" />
              </IconButton>
            </Tooltip>
          }
        />
        <IconButton aria-label={t("refreshToken")} onClick={generate}>
          <Icon name="refreshCcw" />
        </IconButton>
      </Stack>
      <Alert.Root variant="warning">
        <Alert.Indicator />
        <Alert.Title>
          {t(
            "pleaseCopyTheTokenBeforeClosingThisDialogAsItWonTBeReadableA"
          )}
        </Alert.Title>
      </Alert.Root>
      <FormControl
        label={t("description")}
        placeholder={t("eG", { example: t("describeTheToken") })}
        required
        control={form.control}
        name="description"
      />
      <Select
        required
        options={apiTokenLevelOptions.options}
        control={form.control}
        name="level"
        label={t("permissionLevel")}
      />
    </Stack>
  )
}

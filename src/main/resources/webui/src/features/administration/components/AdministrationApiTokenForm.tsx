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
      title: t("Token copied"),
      description: t("Please don't share and save it securely"),
    })
  }, [form, toast])

  return (
    <Stack gap="6">
      <Stack direction="row" gap="5" alignItems="flex-end">
        <FormControl
          label={t("Token")}
          control={form.control}
          name="token"
          suffix={
            <Tooltip content={t("Copy")}>
              <IconButton
                aria-label={t("Copy token")}
                onClick={copy}
                variant="ghost"
                colorPalette="grey"
              >
                <Icon name="copy" />
              </IconButton>
            </Tooltip>
          }
        />
        <IconButton aria-label={t("Refresh token")} onClick={generate}>
          <Icon name="refreshCcw" />
        </IconButton>
      </Stack>
      <Alert.Root bg="yellow.50" color="yellow.800">
        {t(
          "Please copy the token before closing this dialog as it won’t be readable anymore afterwards"
        )}
      </Alert.Root>
      <FormControl
        type={FormControlType.LongText}
        label={t("Description")}
        placeholder={t("e.g. describe the token")}
        required
        control={form.control}
        name="description"
      />
      <Select
        required
        options={apiTokenLevelOptions.options}
        control={form.control}
        name="level"
        label={t("Permission level")}
      />
    </Stack>
  )
}

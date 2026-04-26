import { FormControl, Switch } from "@/components"
import { FormControlType, PASSWORD_UNCHANGED } from "@/components/FormControl"
import { Select } from "@/components/Select"
import { useUserLevelOptions } from "@/hooks"
import { Stack, Text } from "@chakra-ui/react"
import { useEffect } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

export type UserForm = {
  username: string
  level: string
  isRemote: boolean
  password?: string | null
  confirmPassword?: string
}

export type AdministrationUserFormProps = {
  freezePasswords?: boolean
}

export default function AdministrationUserForm(props: AdministrationUserFormProps) {
  const { freezePasswords = false } = props
  const form = useFormContext<UserForm>()
  const { t } = useTranslation()
  const userLevelOptions = useUserLevelOptions()

  const isRemote = useWatch({
    control: form.control,
    name: "isRemote",
  })

  const password = useWatch({
    control: form.control,
    name: "password",
  })

  useEffect(() => {
    if (!isRemote) return
    form.setValue("password", "")
    form.setValue("confirmPassword", "")
  }, [isRemote])

  useEffect(() => {
    if (password == PASSWORD_UNCHANGED) {
      form.setValue("confirmPassword", "")
    }
  }, [password])

  return (
    <Stack gap="6">
      <FormControl
        label={t("username")}
        placeholder={t("eG", { example: "admin" })}
        required
        control={form.control}
        name="username"
      />
      <Select
        required
        options={userLevelOptions.options}
        control={form.control}
        name="level"
        label={t("role")}
        placeholder={t("selectRole")}
      />
      <Stack direction="row" gap="6">
        <Stack gap="0" flex="1">
          <Text fontWeight="medium">{t("remoteUser")}</Text>
          <Text color="grey.400">
            {t("userWillBeAuthenticatedByARemoteServerEGRadius")}
          </Text>
        </Stack>
        <Switch w="initial" control={form.control} name="isRemote" />
      </Stack>
      {!isRemote && (
        <>
          <FormControl
            required={!freezePasswords}
            allowUnchanged={freezePasswords}
            type={FormControlType.Password}
            control={form.control}
            name="password"
            label={t("password")}
            placeholder={t("enterPassword")}
          />
          {password != PASSWORD_UNCHANGED && (
            <FormControl
              required={!freezePasswords}
              type={FormControlType.Password}
              control={form.control}
              name="confirmPassword"
              label={t("confirmPassword")}
              placeholder={t("confirmPassword")}
              rules={{
                validate(value) {
                  return value === password || t("passwordsDonTMatch")
                },
              }}
            />
          )}
        </>
      )}
    </Stack>
  )
}

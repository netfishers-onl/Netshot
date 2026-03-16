import api from "@/api"
import FormControl, { FormControlType } from "@/components/FormControl"
import { useSigninForm } from "@/hooks"
import { Button, Center, Spinner, Stack, Text } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"
import { useSigninMutation, useSigninWithOidcMutation } from "../api/queries"

export function SigninForm() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const form = useSigninForm()
  const { mutation, changePass } = useSigninMutation()
  const signinWithOidcMutation = useSigninWithOidcMutation()
  const isOidcConnection = api.oidc.isOidcConnection()
  const [isOidcForm, setIsOidcForm] = useState<boolean>(isOidcConnection)
  const state = searchParams.get("state")
  const code = searchParams.get("code")

  const submit = form.handleSubmit((values) => {
    if (isOidcForm) {
      window.location.href = api.oidc.generateUrl()
      return
    }
    mutation.mutate(values)
  })

  function toggleOidcForm() {
    setIsOidcForm((prev) => !prev)
  }

  useEffect(() => {
    if (!state || !code) return
    if (state !== api.oidc.getState()) return
    if (mutation.isPending || mutation.isSuccess) return

    api.oidc.removeState()
    signinWithOidcMutation.mutate(code)
  }, [state, code])

  if (signinWithOidcMutation.isPending) {
    return (
      <Center h="100vh">
        <Stack gap="3" alignItems="center">
          <Spinner size="lg" />
          <Text>{t("connecting via SSO...")}</Text>
        </Stack>
      </Center>
    )
  }

  if (isOidcForm) {
    return (
      <Stack gap="2" asChild>
        <form onSubmit={submit}>
          <Button variant="primary" type="submit">
            {t("Sign in with SSO")}
          </Button>
          <Button variant="default" onClick={toggleOidcForm}>
            {t("Sign in with username")}
          </Button>
        </form>
        {signinWithOidcMutation.isError && (
          <Text color="red.500">{t("SSO authentication error")}</Text>
        )}
      </Stack>
    )
  }

  return (
    <Stack gap="5" asChild>
      <form onSubmit={submit}>
        <FormControl
          required
          control={form.control}
          name="username"
          label="Username"
          placeholder={t("Enter your username")}
          rules={{
            required: true,
          }}
          readOnly={changePass}
        />
        <FormControl
          required
          type={FormControlType.Password}
          control={form.control}
          name="password"
          label="Password"
          placeholder={t("Enter password")}
          rules={{
            required: true,
          }}
          readOnly={changePass}
        />
        {changePass && (
          <FormControl
            required
            type={FormControlType.Password}
            control={form.control}
            name="newPassword"
            label="New password"
            placeholder={t("Enter new password")}
            rules={{
              required: true,
            }}
            autoFocus
          />
        )}
        <Stack gap="2">
          <Button
            type="submit"
            loading={mutation.isPending}
            disabled={!form.formState.isValid}
            variant="primary"
          >
            {changePass ? t("Change password and Sign in") : t("Sign in")}
          </Button>
          {isOidcConnection && (
            <Button onClick={toggleOidcForm} variant="default">
              {t("Sign in with SSO")}
            </Button>
          )}
        </Stack>
      </form>
    </Stack>
  )
}

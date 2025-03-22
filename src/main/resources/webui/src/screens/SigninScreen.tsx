import { Box, Button, Heading, Spacer, Stack } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";

import api from "@/api";
import { HttpStatus, type NetshotError } from "@/api/httpClient";
import { Brand } from "@/components";
import FormControl, { FormControlType } from "@/components/FormControl";
import { QUERIES, REDIRECT_SEARCH_PARAM } from "@/constants";
import useToast from "@/hooks/useToast";
import { User } from "@/types";

type SigninForm = {
  username: string;
  password: string;
};

function SigninScreen() {
  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<SigninForm>({
    defaultValues: {
      username: "",
      password: "",
    },
  });
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mutation = useMutation({
    mutationFn: api.auth.signin,
    onSuccess(data) {
      queryClient.setQueryData<User>([QUERIES.USER], data);
      navigate(
        searchParams.get(REDIRECT_SEARCH_PARAM) || "/app",
        { replace: true });
    },
    onError(err: NetshotError) {
      if (err.response.status == HttpStatus.Unauthorized) {
        toast.error({
          title: t("Authentication failed"),
          description: t("Username or password is incorrect"),
        });
      }
      else {
        toast.error({
          title: t("Server error"),
          description: t("The Netshot server didn't reply properly"),
        });
      }
    },
  });

  const submit = useCallback(
    (values: SigninForm) => {
      mutation.mutate(values);
    },
    [mutation]
  );

  return (
    <Stack direction="row" gap="0" h="100vh">
      <Stack justifyContent="center" alignItems="center" flex="1">
        <Stack mx="auto" width="40%" gap="12">
          <Stack gap="6">
            <Heading as="h4" fontSize="2xl">
              {t("Please sign in")}
            </Heading>
            <Stack as="form" gap="5" onSubmit={handleSubmit(submit)}>
              <FormControl
                isRequired
                control={control}
                name="username"
                label="Username"
                placeholder={t("Enter your username")}
                rules={{
                  required: true,
                }}
              />
              <FormControl
                isRequired
                type={FormControlType.Password}
                control={control}
                name="password"
                label="Password"
                placeholder={t("Enter password")}
                rules={{
                  required: true,
                }}
              />
              <Button
                type="submit"
                isLoading={mutation.isPending}
                disabled={!isValid}
                variant="solid"
              >
                {t("Sign in")}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
      <Stack
        direction="column"
        p="60px"
        bg="green.1100"
        flex="0 0 50%"
        gap="5"
        justifyContent="center"
      >
        <Box>
          <Brand mode="dark" sx={{ w: 400 }} />
          <Spacer />
          <Stack ml="100px">
            <Heading
              fontSize="5xl"
              color="white"
              fontWeight="light"
              lineHeight="90%"
            >
              {t("Network orchestration")}
            </Heading>
            <Heading
              fontSize="5xl"
              color="green.500"
              fontWeight="light"
              lineHeight="90%"
            >
              {t("made easy")}
            </Heading>
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
}

export default SigninScreen;

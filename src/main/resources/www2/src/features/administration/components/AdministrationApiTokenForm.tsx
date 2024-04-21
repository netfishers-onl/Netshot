import { FormControl, Icon, Select } from "@/components";
import { FormControlType } from "@/components/FormControl";
import { useToast } from "@/hooks";
import { ApiTokenPermissionLevel, Option } from "@/types";
import { generateToken } from "@/utils";
import { Alert, IconButton, Stack, Tooltip } from "@chakra-ui/react";
import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { API_TOKEN_LEVEL_OPTIONS } from "../constants";

export type ApiTokenForm = {
  description: string;
  level: Option<ApiTokenPermissionLevel>;
  token: string;
};

export default function AdministrationApiTokenForm() {
  const form = useFormContext<ApiTokenForm>();
  const { t } = useTranslation();
  const toast = useToast();

  const generate = useCallback(() => {
    form.setValue("token", generateToken());
  }, [form]);

  const copy = useCallback(() => {
    const values = form.getValues();

    navigator.clipboard.writeText(values.token);

    toast.info({
      title: t("Token copied"),
      description: t("Please don't share and save it securely"),
    });
  }, [form, toast]);

  return (
    <Stack spacing="6">
      <Stack direction="row" spacing="5" alignItems="flex-end">
        <FormControl
          label={t("Token")}
          control={form.control}
          name="token"
          suffix={
            <Tooltip label={t("Copy")}>
              <IconButton
                aria-label={t("Copy token")}
                icon={<Icon name="copy" />}
                onClick={copy}
                variant="ghost"
                colorScheme="grey"
              />
            </Tooltip>
          }
        />
        <IconButton
          aria-label={t("Refresh token")}
          icon={<Icon name="refreshCcw" />}
          onClick={generate}
        />
      </Stack>
      <Alert bg="yellow.50" color="yellow.800">
        {t(
          "Please copy the token before closing this dialog as it won’t be readable anymore afterwards"
        )}
      </Alert>
      <FormControl
        type={FormControlType.LongText}
        label={t("Description")}
        placeholder={t("e.g. describe the token")}
        isRequired
        control={form.control}
        name="description"
      />
      <Select
        isRequired
        options={API_TOKEN_LEVEL_OPTIONS}
        control={form.control}
        name="level"
        label={t("Permission level")}
      />
    </Stack>
  );
}

import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { ApiToken } from "@/types";
import { generateToken } from "@/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { API_TOKEN_LEVEL_OPTIONS, QUERIES } from "../constants";
import AdministrationApiTokenForm, {
  ApiTokenForm,
} from "./AdministrationApiTokenForm";

export type AddApiTokenButtonProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function AddApiTokenButton(props: AddApiTokenButtonProps) {
  const { renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ApiTokenForm>({
    mode: "onChange",
    defaultValues: {
      description: "",
      level: API_TOKEN_LEVEL_OPTIONS[0],
      token: generateToken(),
    },
  });

  const mutation = useMutation(
    async (payload: Partial<ApiToken>) => api.admin.createApiToken(payload),
    {
      onSuccess() {
        dialog.close();
        toast.success({
          title: t("Success"),
          description: t("Api token has been successfully created"),
        });

        queryClient.invalidateQueries([QUERIES.ADMIN_API_TOKENS]);

        form.reset();
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const onSubmit = useCallback(
    async (values: ApiTokenForm) => {
      mutation.mutate({
        description: values.description,
        level: values.level.value,
        token: values.token,
      });
    },
    [mutation]
  );

  useEffect(() => {
    return () => form.reset();
  }, [form]);

  const dialog = Dialog.useForm({
    title: t("Create API token"),
    description: <AdministrationApiTokenForm />,
    form,
    isLoading: mutation.isLoading,
    size: "2xl",
    onSubmit,
    onCancel() {
      form.reset();
    },
    submitButton: {
      label: t("Create"),
    },
  });

  return renderItem(dialog.open);
}

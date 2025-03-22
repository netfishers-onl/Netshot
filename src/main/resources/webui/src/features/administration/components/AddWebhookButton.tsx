import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Hook } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { QUERIES, WEBHOOK_DATA_TYPE_OPTIONS } from "../constants";
import AdministrationWebhookForm, {
  WebhookForm,
} from "./AdministrationWebhookForm";

export type AddWebhookButtonProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function AddWebhookButton(props: AddWebhookButtonProps) {
  const { renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const form = useForm<WebhookForm>({
    mode: "onChange",
    defaultValues: {
      name: "",
      enabled: true,
      action: WEBHOOK_DATA_TYPE_OPTIONS[0],
      url: "",
      sslValidation: true,
      triggers: [],
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: Partial<Hook>) =>
        api.admin.createHook(payload),
    onSuccess(res) {
      dialog.close();
      toast.success({
        title: t("Success"),
        description: t("Webhook {{name}} has been successfully created", {
          name: res?.name,
        }),
      });

      queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_WEBHOOKS] });

      form.reset();
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const onSubmit = useCallback(
    async (values: WebhookForm) => {
      mutation.mutate({
        name: values.name,
        action: values.action?.value,
        url: values.url,
        enabled: values.enabled,
        sslValidation: values.sslValidation,
        triggers: values.triggers,
        type: "Web",
      });
    },
    [mutation]
  );

  useEffect(() => {
    return () => form.reset();
  }, [form]);

  const dialog = Dialog.useForm({
    title: t("Create webhook"),
    description: <AdministrationWebhookForm />,
    form,
    isLoading: mutation.isPending,
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

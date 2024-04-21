import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Hook } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { QUERIES, WEBHOOK_DATA_TYPE_OPTIONS } from "../constants";
import AdministrationWebhookForm, {
  WebhookForm,
} from "./AdministrationWebhookForm";

export type EditWebhookButtonProps = {
  webhook: Hook;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function EditWebhookButton(props: EditWebhookButtonProps) {
  const { webhook, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const defaultValues = useMemo(() => {
    const action = WEBHOOK_DATA_TYPE_OPTIONS.find(
      (option) => option.value === webhook.action
    );

    return {
      name: webhook.name,
      enabled: webhook.enabled,
      action,
      url: webhook.url,
      sslValidation: webhook.sslValidation,
      triggers: webhook.triggers,
    };
  }, [webhook]);

  const form = useForm<WebhookForm>({
    mode: "onChange",
    defaultValues,
  });

  const mutation = useMutation(
    async (payload: Partial<Hook>) =>
      api.admin.updateHook(webhook?.id, payload),
    {
      onSuccess(res) {
        dialog.close();
        toast.success({
          title: t("Success"),
          description: t("Webhook {{name}} has been successfully updated", {
            name: res?.name,
          }),
        });

        queryClient.invalidateQueries([QUERIES.ADMIN_WEBHOOKS]);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

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

  const dialog = Dialog.useForm({
    title: t("Update webhook"),
    description: <AdministrationWebhookForm />,
    form,
    isLoading: mutation.isLoading,
    size: "2xl",
    onSubmit,
    onCancel() {
      form.reset();
    },
    submitButton: {
      label: t("Apply changes"),
    },
  });

  return renderItem(dialog.open);
}

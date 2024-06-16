import api, { CreateOrUpdatePolicy } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import PolicyForm, { Form } from "./PolicyForm";

export type AddPolicyButtonProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function AddPolicyButton(props: AddPolicyButtonProps) {
  const { renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const form = useForm<Form>({
    mode: "onChange",
    defaultValues: {
      name: "",
      targetGroups: [],
    },
  });

  const mutation = useMutation(
    async (payload: CreateOrUpdatePolicy) => api.policy.create(payload),
    {
      onSuccess(res) {
        dialog.close();
        toast.success({
          title: t("Success"),
          description: t(
            "Policy {{policyName}} has been successfully created",
            {
              policyName: res?.name,
            }
          ),
        });

        queryClient.invalidateQueries([QUERIES.POLICY_LIST]);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const onSubmit = useCallback(
    async (values: Form) => {
      mutation.mutate({
        name: values.name,
        targetGroups: values.targetGroups.map((group) => group.id),
      });
    },
    [mutation]
  );

  const dialog = Dialog.useForm({
    title: t("Add policy"),
    description: <PolicyForm />,
    form,
    isLoading: mutation.isLoading,
    size: "2xl",
    onSubmit,
    onCancel() {
      form.reset();
    },
    submitButton: {
      label: t("Add policy"),
    },
  });

  return renderItem(dialog.open);
}

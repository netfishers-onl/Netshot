import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { CreateOrUpdatePolicy } from "@/api/policy";
import { QUERIES } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Policy } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import PolicyForm, { Form } from "./PolicyForm";

export type EditPolicyButtonProps = {
  policy: Policy;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function EditPolicyButton(props: EditPolicyButtonProps) {
  const { policy, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const form = useForm<Form>({
    mode: "onChange",
    defaultValues: {
      name: policy?.name,
      targetGroups: policy?.targetGroups,
    },
  });

  const mutation = useMutation(
    async (payload: CreateOrUpdatePolicy) =>
      api.policy.update(policy.id, payload),
    {
      onSuccess(res) {
        dialog.close();
        toast.success({
          title: t("Success"),
          description: t(
            "Policy {{policyName}} has been successfully updated",
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
    title: t("Edit policy"),
    description: <PolicyForm />,
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

  const open = useCallback(
    (evt: MouseEvent) => {
      evt.stopPropagation();
      dialog.open();
    },
    [dialog]
  );

  return renderItem(open);
}

import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { MouseEvent, ReactElement, useCallback } from "react";
import { QUERIES } from "../constants";
import { Mutation, QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Text } from "@chakra-ui/react";

export type ReloadDeviceDriversButtonProps = {
	renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
}

export default function ReloadDeviceDriversButton(props: ReloadDeviceDriversButtonProps) {
  const { renderItem } = props;
	const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();

	const mutation = useMutation({
		mutationFn: async() => api.admin.getAllDrivers({}, true),
		onSuccess() {
			toast.success({
        title: t("Success"),
        description: t("The drivers have been reloaded."),
			})
			queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_DRIVERS] });
			dialog.close();
		},
    onError(err: NetshotError) {
      toast.error(err);
    },
	});
	
	const dialog = Dialog.useConfirm({
		title: t("Reload drivers"),
		description: (
			<>
				<Text>
					{t("This will dynamically reload all device drivers from source files.")}
				</Text>
				<Text>
					{t("Use this if you have updated a driver file on Netshot server and want to apply the new code.")}
				</Text>
			</>
		),
		isLoading: mutation.isPending,
		onConfirm() {
			mutation.mutate();
		},
		confirmButton: {
			label: t("Reload"),
			props: {
				colorScheme: "green",
			},
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
import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Level, User } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"
import { QUERIES } from "../constants"
import UserFormComponent, { UserForm } from "./UserForm"

export type AddUserTriggerProps = { children: React.ReactElement<any> } & Record<string, unknown>

export default function AddUserTrigger({ children, ...rest }: AddUserTriggerProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const dialog = useFormDialogWithMutation()

  const form = useForm<UserForm>({
    mode: "onChange",
    defaultValues: {
      username: "",
      level: Level.Admin.toString(),
      isRemote: false,
      password: "",
      confirmPassword: "",
    },
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.ADMIN_USER_CREATE,
    mutationFn: async (payload: Partial<User>) => api.admin.createUser(payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.ADMIN_USER_CREATE, {
      title: t("user.create"),
      description: <UserFormComponent />,
      form,
      size: "lg",
      async onSubmit(values: UserForm) {
        await mutation.mutateAsync({
          username: values.username,
          level: +values.level,
          local: !values.isRemote,
          password: values.password,
        })

        dialogRef.close()

        toast.success({
          title: t("common.success"),
          description: t("user.successfullyCreated", {
            username: values.username,
          }),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_USERS] })
        form.reset()
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("common.create"),
      },
    })
  }

  const isMenuItem = "value" in children.props
  return React.cloneElement(children, isMenuItem ? { onSelect: open, ...rest } : { ...rest, onClick: open })
}

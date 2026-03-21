import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { PropsWithRenderItem, User } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"
import AdministrationUserForm, { UserForm } from "./AdministrationUserForm"

export type EditUserButtonProps = PropsWithRenderItem<{
  user: User
}>

export default function EditUserButton(props: EditUserButtonProps) {
  const { user, renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const dialog = useFormDialogWithMutation()

  const defaultValues = useMemo(
    () => ({
      username: user?.username,
      level: user?.level?.toString(),
      isRemote: !user.local,
      password: "",
      confirmPassword: "",
      changePassword: false,
    }),
    [user]
  )

  const form = useForm<UserForm>({
    mode: "onChange",
    defaultValues,
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.ADMIN_USER_UPDATE,
    mutationFn: async (payload: Partial<User>) => api.admin.updateUser(user?.id, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.ADMIN_USER_UPDATE, {
      title: t("editUser2"),
      description: <AdministrationUserForm showChangePassword />,
      form,
      size: "lg",
      async onSubmit(values: UserForm) {
        const change: Partial<User> = {
          username: values.username,
          level: +values.level,
          local: !values.isRemote,
        }
        if (values.changePassword) {
          change.password = values.password
        }

        await mutation.mutateAsync(change)

        dialogRef.close()

        toast.success({
          title: t("success"),
          description: t("userHasBeenSuccessfullyUpdated", {
            username: values.username,
          }),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_USERS] })
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("applyChanges"),
      },
    })
  }

  return renderItem(open)
}

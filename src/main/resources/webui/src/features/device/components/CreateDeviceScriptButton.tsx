import api from "@/api"
import { FormControl, Icon } from "@/components"
import { MUTATIONS, QUERIES } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Device, Script, SimpleDevice } from "@/types"
import { Button, Stack } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

export type CreateDeviceScriptButtonProps = {
  devices: SimpleDevice[] | Device[]
  onCreated(script: Script): void
}

export function CreateDeviceScriptButton(props: CreateDeviceScriptButtonProps) {
  const { devices, onCreated } = props
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const dialog = useFormDialogWithMutation()

  const form = useForm<{
    name: string
    driver: string
  }>({
    defaultValues: {
      name: "",
      driver: devices[0]?.driver,
    },
  })

  const { mutateAsync, isPending } = useMutation({
    mutationKey: MUTATIONS.SCRIPT_CREATE,
    mutationFn: api.script.create,
    onError() {
      toast.error({
        title: t("Error"),
        description: t("An error occurred during the script creation"),
      })
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.SCRIPT_CREATE, {
      title: t("Create device script"),
      description: (
        <Stack>
          <FormControl
            label={t("Name")}
            control={form.control}
            name="name"
            placeholder={t("e.g. my script")}
          />
          <FormControl label={t("Driver")} control={form.control} name="driver" readOnly />
        </Stack>
      ),
      form,
      async onSubmit(values) {
        const data = await mutateAsync({
          name: values.name,
          deviceDriver: values.driver,
          script: [
            "function run(cli, device) {",
            '   cli.macro("configure");',
            '   cli.command("no ip domain-lookup")',
            '   cli.macro("end");',
            '   cli.macro("save");',
            "}",
          ].join("\n"),
        })

        dialogRef.close()
        form.reset()
        await queryClient.invalidateQueries({ queryKey: [QUERIES.SCRIPT_LIST] })
        onCreated(data)
      },
      isLoading: isPending,
      submitButton: {
        label: t("Create"),
      },
    })
  }

  return (
    <Button onClick={open}>
      <Icon name="plus" />
      {t("Create")}
    </Button>
  )
}

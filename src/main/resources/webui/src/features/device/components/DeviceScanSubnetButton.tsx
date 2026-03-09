import api, { CreateOrUpdateTaskPayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { DomainSelect } from "@/components"
import FormControl from "@/components/FormControl"
import Icon from "@/components/Icon"
import TaskDialog from "@/components/TaskDialog"
import { MUTATIONS } from "@/constants"
import { useCustomDialog, useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { PropsWithRenderItem, TaskType } from "@/types"
import { Button, Heading, IconButton, Stack } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { useEffect } from "react"
import { useFieldArray, useForm, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

type Form = {
  domainId: string
  subnets: string[]
}

export type DeviceScanSubnetButtonProps = PropsWithRenderItem

function DeviceCreateForm() {
  const form = useFormContext()
  const { t } = useTranslation()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subnets",
  })

  useEffect(() => {
    append("")
  }, [])

  return (
    <Stack gap="6">
      <DomainSelect required control={form.control} name="domainId" />
      <Stack gap="6">
        <Heading as="h5" size="sm">
          {t("Subnets or IP addresses")}
        </Heading>
        {fields.length > 0 && (
          <Stack gap="3">
            {fields.map((field, index) => (
              <Stack direction="row" gap="4" key={field.id}>
                <FormControl
                  required
                  control={form.control}
                  name={`subnets.${index}`}
                  placeholder={t("Enter an IP address (e.g. 10.100.2.8)")}
                  rules={{
                    pattern: {
                      value:
                        /(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})/g,
                      message: t("This is not a valid IP address"),
                    },
                  }}
                />
                {fields.length > 1 && (
                  <IconButton
                    onClick={() => remove(index)}
                    variant="ghost"
                    colorPalette="green"
                    aria-label={t("Remove this subnet")}
                  >
                    <Icon name="trash" />
                  </IconButton>
                )}
              </Stack>
            ))}
          </Stack>
        )}
        <Stack direction="row">
          <Button onClick={() => append("")}>
            <Icon name="plus" />
            {t("Add entry")}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default function DeviceScanSubnetButton(props: DeviceScanSubnetButtonProps) {
  const { renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const dialog = useFormDialogWithMutation()
  const taskDialog = useCustomDialog()

  const form = useForm<Form>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      domainId: null,
      subnets: [],
    },
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.TASK_CREATE,
    mutationFn: async (payload: CreateOrUpdateTaskPayload) => api.task.create(payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.TASK_CREATE, {
      title: t("Scan subnets for devices"),
      description: <DeviceCreateForm />,
      form,
      async onSubmit(values: Form) {
        const task = await mutation.mutateAsync({
          type: TaskType.ScanSubnets,
          subnets: values.subnets.join("\n"),
          domain: +values.domainId,
        })

        dialogRef.close()

        taskDialog.open(<TaskDialog id={task.id} />)
      },
      size: "xl",
      submitButton: {
        label: t("Add"),
      },
    })
  }

  return renderItem(open)
}

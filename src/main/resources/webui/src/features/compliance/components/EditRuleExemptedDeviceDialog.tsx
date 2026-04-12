import api, { RuleStateChangePayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { DeviceAutocomplete, FormControl, Icon, Search } from "@/components"
import { FormControlType } from "@/components/FormControl"
import { MUTATIONS } from "@/constants"
import { useDialogConfig, useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { ExemptedDevice, Rule, SimpleDevice } from "@/types"
import { useI18nUtil } from "@/i18n"
import { search } from "@/utils"
import { Button, Dialog, Flex, IconButton, Portal, Spinner, Stack, Text } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { addDays } from "date-fns"
import { useCallback, useState } from "react"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

type Form = {
  device: SimpleDevice
  expirationDate: string
}

type AddRuleExemptedDeviceFormProps = {
  exemptedDevices: ExemptedDevice[]
}

function AddRuleExemptedDeviceForm(props: AddRuleExemptedDeviceFormProps) {
  const { exemptedDevices } = props
  const { t } = useTranslation()
  const form = useFormContext<Form>()
  const selectedDevice = useWatch({
    control: form.control,
    name: "device",
  })

  function onChange(device: SimpleDevice) {
    form.setValue("device", device)
  }

  function filterBy(options: SimpleDevice[]) {
    return options.filter(
      (option) => !exemptedDevices.map((device) => device.id).includes(option.id)
    )
  }

  return (
    <Stack gap="4">
      <DeviceAutocomplete
        selectionBehavior="replace"
        value={selectedDevice ? [selectedDevice.id.toString()] : []}
        onSelectItem={onChange}
        filterBy={filterBy}
      />
      <FormControl
        type={FormControlType.Date}
        label={t("endDate")}
        control={form.control}
        name="expirationDate"
      />
    </Stack>
  )
}

type AddRuleExemptedDeviceButtonProps = {
  policyId: number
  rule: Rule
  exemptedDevices: ExemptedDevice[]
}

function AddRuleExemptedDeviceButton(props: AddRuleExemptedDeviceButtonProps) {
  const { policyId, rule, exemptedDevices } = props

  const queryClient = useQueryClient()
  const toast = useToast()
  const { t } = useTranslation()
  const dialog = useFormDialogWithMutation()

  const form = useForm<Form>({
    mode: "onChange",
    defaultValues: {
      device: null,
      expirationDate: addDays(new Date(), 7).toISOString().substring(0, 10),
    },
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.RULE_EXEMPTED_DEVICE_UPDATE,
    mutationFn: async (payload: RuleStateChangePayload) =>
      api.rule.updateExemptedDevice(rule.id, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.RULE_EXEMPTED_DEVICE_UPDATE, {
      title: t("addExemptedDevice"),
      description: <AddRuleExemptedDeviceForm exemptedDevices={exemptedDevices} />,
      form,
      size: "lg",
      async onSubmit(values: Form) {
        const exemptions = exemptedDevices.reduce((previous, current) => {
          previous[current.id] = current.expirationDate
          return previous
        }, {})

        exemptions[values.device.id] = values.expirationDate

        await mutation.mutateAsync({
          name: rule.name,
          exemptions,
          enabled: rule.enabled,
        })

        dialogRef.close()

        toast.success({
          title: t("success"),
          description: t("ruleExemptedDevicesHasBeenSuccessfullyUpdated", {
            name: rule.name,
          }),
        })

        queryClient.invalidateQueries({ queryKey: [QUERIES.POLICY_RULE_LIST, policyId] })
        queryClient.invalidateQueries({ queryKey: [QUERIES.RULE_DETAIL, policyId, rule.id] })
        queryClient.invalidateQueries({ queryKey: [QUERIES.RULE_EXEMPTED_DEVICES] })

        form.reset()
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("add"),
      },
    })
  }

  return (
    <Button variant="outline" onClick={open}>
      <Icon name="plus" />
      {t("add")}
    </Button>
  )
}

export type EditRuleExemptedDeviceDialogProps = {
  policyId: number
  rule: Rule
}

export default function EditRuleExemptedDeviceDialog(props: EditRuleExemptedDeviceDialogProps) {
  const { policyId, rule } = props
  const { t } = useTranslation()
  const { formatDate: formatLocalDate } = useI18nUtil()
  const toast = useToast()
  const dialogConfig = useDialogConfig()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState<string>("")

  const { data: exemptedDevices, isPending } = useQuery({
    queryKey: [QUERIES.RULE_EXEMPTED_DEVICES, rule?.id, query],
    queryFn: () => api.rule.getAllExemptedDevices(rule?.id),
    select: useCallback(
      (res: ExemptedDevice[]): ExemptedDevice[] => {
        return search(res, "name").with(query)
      },
      [query]
    ),
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: RuleStateChangePayload) =>
      api.rule.updateExemptedDevice(rule.id, payload),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [QUERIES.RULE_EXEMPTED_DEVICES] })
    },
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const onQuery = useCallback((query: string) => {
    setQuery(query)
  }, [])

  const remove = useCallback(
    (device: ExemptedDevice) => {
      const exemptions = exemptedDevices
        .filter((exemptedDevice) => exemptedDevice.id !== device.id)
        .reduce((previous, current) => {
          previous[current.id] = current.expirationDate
          return previous
        }, {})

      updateMutation.mutate({
        enabled: rule.enabled,
        exemptions,
        name: rule.name,
      })
    },
    [updateMutation, exemptedDevices, rule]
  )

  return (
    <Dialog.Root
      open={dialogConfig.props.isOpen}
      placement="center"
      motionPreset="slide-in-bottom"
      size={dialogConfig.props.size}
      variant={dialogConfig.props.variant}
      closeOnInteractOutside={false}
      scrollBehavior="inside"
      onOpenChange={(e) => {
        if (!e.open) {
          dialogConfig.close()
        }
      }}
      onExitComplete={() => {
        if (dialogConfig.props?.onCancel) dialogConfig.props.onCancel()
        dialogConfig.remove()
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header as="h3" fontSize="2xl" fontWeight="semibold">
              {t("exemptedDevices")}
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body pb="7">
              <Stack gap="6">
                <Stack direction="row" gap="3">
                  <Search
                    onQuery={onQuery}
                    placeholder={t("searchWithDeviceNameOrIp")}
                    flex="1"
                  />

                  <AddRuleExemptedDeviceButton
                    key={exemptedDevices?.length}
                    policyId={policyId}
                    rule={rule}
                    exemptedDevices={exemptedDevices}
                  />
                </Stack>
                {isPending ? (
                  <Flex py="4" justifyContent="center" alignContent="center">
                    <Spinner />
                  </Flex>
                ) : (
                  <>
                    {exemptedDevices?.length > 0 ? (
                      <Stack gap="4">
                        {exemptedDevices?.map((device) => (
                          <Stack
                            px="4"
                            py="4"
                            gap="3"
                            border="1px"
                            borderColor="grey.100"
                            bg="white"
                            borderRadius="2xl"
                            boxShadow="sm"
                            key={device.id}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Stack gap="1">
                              <Text fontWeight="medium">{device?.name}</Text>
                              <Text color="grey.400">
                                {t("expiresOn", { date: formatLocalDate(device?.expirationDate, { dateStyle: "medium" }) })}
                              </Text>
                            </Stack>
                            <IconButton
                              variant="ghost"
                              colorScheme="green"
                              aria-label={t("removeDevice")}
                              onClick={() => remove(device)}
                            >
                              <Icon name="trash" />
                            </IconButton>
                          </Stack>
                        ))}
                      </Stack>
                    ) : (
                      <Flex
                        bg="grey.50"
                        borderRadius="xl"
                        py="4"
                        justifyContent="center"
                        alignContent="center"
                      >
                        <Text color="grey.500">{t("noExemptedDeviceSelected")}</Text>
                      </Flex>
                    )}
                  </>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="primary" onClick={() => dialogConfig.close()}>
                {t("close")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

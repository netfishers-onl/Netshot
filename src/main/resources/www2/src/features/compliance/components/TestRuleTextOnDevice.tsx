import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { TestRuleTextOnDevicePayload } from "@/api/rule";
import { DeviceAutocomplete, Icon } from "@/components";
import { useToast } from "@/hooks";
import { SimpleDevice } from "@/types";
import { IconButton, Stack } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

export type TestRuleOnDevice = {
  rule: TestRuleTextOnDevicePayload;
};

export default function TestRuleTextOnDevice(props: TestRuleOnDevice) {
  const { rule } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const [device, setDevice] = useState<SimpleDevice>(null);

  const mutation = useMutation(
    async (payload: TestRuleTextOnDevicePayload) => api.rule.testText(payload),
    {
      onSuccess(res) {
        toast.script({
          title: t("Result: {{result}}", {
            result: res.result,
          }),
          description: res.comment,
        });
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const runTest = useCallback(() => {
    mutation.mutate({
      device: device.id,
      ...rule,
    });
  }, [device, rule]);

  return (
    <Stack direction="row">
      <DeviceAutocomplete
        value={device}
        onFocus={() => setDevice(null)}
        onChange={(device) => {
          setDevice(device);
        }}
      />
      <IconButton
        aria-label={t("Test on device")}
        icon={<Icon name="play" />}
        isDisabled={!device}
        onClick={runTest}
        isLoading={mutation.isLoading}
      />
    </Stack>
  );
}

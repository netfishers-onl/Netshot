import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { TestRuleScriptOnDevicePayload } from "@/api/rule";
import { DeviceAutocomplete, Icon } from "@/components";
import { useToast } from "@/hooks";
import { RuleType, SimpleDevice } from "@/types";
import { IconButton, Stack } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

export type TestRuleOnDevice = {
  script: string;
  type: RuleType;
};

export default function TestRuleScriptOnDevice(props: TestRuleOnDevice) {
  const { script, type } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const [device, setDevice] = useState<SimpleDevice>(null);

  const mutation = useMutation(
    async (payload: TestRuleScriptOnDevicePayload) =>
      api.rule.testScript(payload),
    {
      onSuccess(res) {
        toast.script({
          title: t("Result: {{result}}", {
            result: res.result,
          }),
          description: res.scriptError,
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
      script,
      type,
    });
  }, [device, script, type]);

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
        variant="primary"
        aria-label={t("Test on device")}
        icon={<Icon name="play" />}
        isDisabled={!device}
        onClick={runTest}
        isLoading={mutation.isLoading}
      />
    </Stack>
  );
}

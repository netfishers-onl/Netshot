import { MonacoEditorControl } from "@/components";
import { RuleType } from "@/types";
import { Stack } from "@chakra-ui/react";
import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { RuleForm } from "../types";
import { RuleEditForm } from "./RuleEditForm";
import TestRuleScriptOnDevice from "./TestRuleScriptOnDevice";

export type RuleEditScriptProps = {
  type: RuleType;
  deviceDriver?: string;
};

export default function RuleEditScript(props: RuleEditScriptProps) {
  const { type, deviceDriver } = props;
  const form = useFormContext<RuleForm>();
  const language = useMemo(
    () => (type === RuleType.Python ? "python" : "javascript"),
    [type]
  );
  const script = useWatch({
    control: form.control,
    name: "script",
  });

  return (
    <Stack direction="row" spacing="7" overflow="auto" flex="1">
      <Stack w="340px" overflow="auto">
        <RuleEditForm type={type} deviceDriver={deviceDriver} />
      </Stack>
      <Stack flex="1" spacing="5">
        <TestRuleScriptOnDevice script={script} type={type} />
        <MonacoEditorControl
          isRequired
          control={form.control}
          name="script"
          language={language}
        />
      </Stack>
    </Stack>
  );
}

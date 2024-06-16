import { DeviceType, DiagnosticResultType, Group, Option } from "@/types";

export type Form = {
  name: string;
  resultType: Option<DiagnosticResultType>;
  targetGroup: Group;
  deviceDriver: Option<DeviceType>;
  cliMode: Option<string>;
  command: string;
  modifierPattern: string;
  modifierReplacement: string;
  script: string;
};

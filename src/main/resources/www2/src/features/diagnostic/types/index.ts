import { DeviceType, DiagnosticResultType, Option } from "@/types";

export type Form = {
  name: string;
  resultType: Option<DiagnosticResultType>;
  targetGroup: Option<number>;
  deviceDriver: Option<DeviceType>;
  cliMode: Option<string>;
  command: string;
  modifierPattern: string;
  modifierReplacement: string;
  script: string;
};

import { DriverOptionType } from "./device";

export type ScriptUserInputDefinition = {
  name: string;
  type: DriverOptionType;
  label: string;
  description: string;
  choices?: string[];
  defaultValue?: string;
};

export type Script = {
  id: number;
  name: string;
  script: string;
  deviceDriver: string;
  author: string;
  folder: string;
  userInputDefinitions: Record<string, ScriptUserInputDefinition>;
  realDeviceType: string;
};

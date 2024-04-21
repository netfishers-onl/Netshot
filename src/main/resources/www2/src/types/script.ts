export type ScriptUserInputDefinition = {
  name: string;
  type: string;
  label: string;
  description: string;
};

export type Script = {
  id: number;
  name: string;
  script: string;
  deviceDriver: string;
  author: string;
  userInputDefinitions: Record<string, ScriptUserInputDefinition>;
  realDeviceType: string;
};

import { TaskType } from "./task";

export enum HookTriggerType {
  PostTask = "POST_TASK",
}

export type HookTrigger = {
  type: HookTriggerType;
  item: TaskType;
};

export enum HookActionType {
  PostJSON = "POST_JSON",
  PostXML = "POST_XML",
}

export type Hook = {
  id: number;
  action: HookActionType;
  name: string;
  enabled: boolean;
  triggers: HookTrigger[];
  type: string;
  sslValidation: boolean;
  url: string;
};

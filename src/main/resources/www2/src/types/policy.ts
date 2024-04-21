import { Group } from "./group";

export type Policy = {
  id: number;
  name: string;
  targetGroups: Group[];
  ruleCount: number;
};

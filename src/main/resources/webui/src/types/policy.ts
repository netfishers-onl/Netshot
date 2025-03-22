import { Group } from "./group";
import { Rule } from "./rule";

export type Policy = {
  id: number;
  name: string;
  targetGroups: Group[];
  rules?: Rule[];
};

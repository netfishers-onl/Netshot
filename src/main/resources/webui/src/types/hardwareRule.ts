import { Group } from "./group";

export type HardwareRule = {
  id: number;
  targetGroup: Group;
  driver: string;
  family: string;
  familyRegExp: boolean;
  partNumber: string;
  partNumberRegExp: boolean;
  endOfSale: number;
  endOfLife: number;
  deviceType: string;
};

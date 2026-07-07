export enum GroupType {
  Static = "StaticDeviceGroup",
  Dynamic = "DynamicDeviceGroup",
}

export type Group = {
  changeDate: number;
  id: number;
  name: string;
  folder: string;
  hiddenFromReports: boolean;
  type: GroupType;
  query?: string;
};

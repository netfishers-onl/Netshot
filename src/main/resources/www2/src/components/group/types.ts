import { DeviceType, Option, SimpleDevice } from "@/types";

export enum FormStep {
  Type,
  Details,
}

export type AddGroupForm = {
  name: string;
  folder: string;
  visibleInReports: boolean;
  staticDevices: SimpleDevice[];
  driver: Option<DeviceType>;
  query: string;
};

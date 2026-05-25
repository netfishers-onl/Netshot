import { Address } from "./address";

export type MgmtDomain = {
  id: number;
  changeDate: number;
  name: string;
  description: string;
  server4Address: Address;
  server6Address: Address;
};

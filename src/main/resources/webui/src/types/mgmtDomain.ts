import { Address } from "./address";

export type MgmtDomain = {
  id: number;
  changeDate: string;
  name: string;
  description: string;
  server4Address: Address;
  server6Address: Address;
};

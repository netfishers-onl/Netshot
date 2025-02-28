export enum AddressUsage {
  Primary = "Primary",
}

export type Address = {
  prefixLength: number;
  addressUsage: AddressUsage;
  ip: string;
};

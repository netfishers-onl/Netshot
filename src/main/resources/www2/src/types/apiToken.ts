export type ApiToken = {
  id: number;
  description: string;
  level: ApiTokenPermissionLevel;
  token?: string;
};

export enum ApiTokenPermissionLevel {
  ReadOnly = 10,
  ReadWrite = 100,
  ReadWriteCommandOnDevice = 500,
  Admin = 1000,
}

export type User = {
  id: number;
  level: Level;
  local: boolean;
  username: string;
  password?: string;
};

export enum Level {
  Visitor = 10,
  Operator = 50,
  ReadWrite = 100,
  ReadWriteCommandOnDevice = 500,
  Admin = 1000,
}

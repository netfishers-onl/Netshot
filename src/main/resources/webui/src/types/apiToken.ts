import { Level } from "./user"

export type ApiToken = {
  id: number;
  description: string;
  level: Level;
  token?: string;
};

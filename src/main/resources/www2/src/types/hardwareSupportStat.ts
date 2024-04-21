export enum HardwareSupportStatType {
  Eos = ".RestService$RsHardwareSupportEoSStat",
  Eol = ".RestService$RsHardwareSupportEoLStat",
}

export type HardwareSupportStat = {
  eoxDate: number;
  deviceCount: number;
  type: HardwareSupportStatType;
};

export type Config = {
  deviceName: string;
  deviceId: number;
  changeDate: string;
  author: string;
  id: number;
};

export enum ConfigDiffType {
  Change = "CHANGE",
}

export type ConfigDiffHierarchy = {
  line: string;
  position: number;
};

export type ConfigDiffProp = {
  item: string;
  diffType: ConfigDiffType;
  originalPosition: number;
  revisedPosition: number;
  originalLines: string[];
  revisedLines: string[];
  preContext: string[];
  postContext: string[];
  hierarchy: ConfigDiffHierarchy[];
};

export type ConfigDiff = {
  originalDate: string;
  revisedDate: string;
  deltas: {
    additionalProp1: ConfigDiffProp[];
    additionalProp2: ConfigDiffProp[];
    additionalProp3: ConfigDiffProp[];
  };
};

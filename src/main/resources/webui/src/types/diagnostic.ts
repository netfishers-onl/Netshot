import { Group } from "./group";

export enum DiagnosticResultType {
  Text = "TEXT",
  Numeric = "NUMERIC",
  Binary = "BINARY",
}

export enum DiagnosticType {
  Simple = "SimpleDiagnostic",
  Javascript = "JavaScriptDiagnostic",
  Python = "PythonDiagnostic",
}

export type Diagnostic = {
  id: number;
  name: string;
  targetGroup: Group;
  enabled: boolean;
  resultType: DiagnosticResultType;
  type: DiagnosticType;
  deviceDriver: string;
  deviceDriverDescription: string;
  cliMode: string;
  command: string;
  modifierPattern: string;
  modifierReplacement: string;
  script: string;
};

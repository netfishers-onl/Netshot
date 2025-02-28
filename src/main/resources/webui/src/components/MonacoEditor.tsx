import { Box, BoxProps } from "@chakra-ui/react";
import { editor, languages } from "monaco-editor";
import {
  MutableRefObject,
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

self.MonacoEnvironment = {
  async getWorker(_, label) {
    let worker;

    if (label === "typescript" || label === "javascript") {
      worker = await import(
        "monaco-editor/esm/vs/language/typescript/ts.worker?worker"
      );
    } else {
      worker = await import("monaco-editor/esm/vs/editor/editor.worker?worker");
    }

    return worker.default();
  },
};

/**
 * Add extra library for typescript autocompletion
 */
languages.typescript.typescriptDefaults.addExtraLib(`
  type DeviceConfigurationType = "systemConfiguration";
  type CliMacroDefinition = "configure" | "end" | "save";
  type CliCommandDefinition = "no ip domain-lookup";

  class CLI {
    command(cmd: string) {
      return cmd;
    }

    macro(key: CliMacroDefinition) {
      return key;
    }
  }

  class Diagnostic {
    set(value: string) {
    
    }
  }

  class Device {
    private config: Map<DeviceConfigurationType, {}>;

    get(type: DeviceConfigurationType) {
      return this.config.get(type);
    }
  }
`);

export type MonacoEditorProps = {
  language?: editor.IStandaloneEditorConstructionOptions["language"] | "python";
  readOnly?: boolean;
  value?: string;
  onModelChange?(value: string): void;
  onFocus?(): void;
  onBlur?(): void;
} & BoxProps;

function MonacoEditor(
  props: MonacoEditorProps,
  ref: MutableRefObject<HTMLDivElement>
) {
  const {
    value,
    readOnly = false,
    language = "typescript",
    onModelChange,
    onFocus,
    onBlur,
    ...other
  } = props;
  const container = useRef<HTMLDivElement>(null);
  const ide = useRef<editor.IStandaloneCodeEditor>();

  useLayoutEffect(() => {
    if (!container?.current) return;
    if (ide?.current) return;

    ide.current = editor.create(container.current, {
      value,
      language,
      automaticLayout: true,
      readOnly,
      padding: {
        top: 20,
      },
    });
  }, [container, value, readOnly, language]);

  useEffect(() => {
    if (!ide) {
      return;
    }

    if (onModelChange) {
      ide.current.onDidChangeModelContent(() => {
        onModelChange(ide.current.getModel().getValue());
      });
    }

    if (onFocus) {
      ide.current.onDidFocusEditorText(onFocus);
    }

    if (onBlur) {
      ide.current.onDidBlurEditorText(onBlur);
    }
  }, [onModelChange, onFocus, onBlur, ide]);

  return (
    <Box
      ref={ref}
      position="relative"
      py="4"
      flex="1"
      borderRadius="lg"
      border="1px solid"
      borderColor="grey.100"
      {...other}
    >
      <Box
        flex="1"
        position="absolute"
        top="0"
        left="0"
        bottom="0"
        right="0"
        width="100%"
        height="100%"
        ref={container}
      />
    </Box>
  );
}

export default forwardRef(MonacoEditor);

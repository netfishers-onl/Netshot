import { Box, BoxProps } from "@chakra-ui/react";
import { editor, languages } from "monaco-editor";
import {
  MutableRefObject,
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === "json") {
      return new jsonWorker();
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker();
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new htmlWorker();
    }
    if (label === "typescript" || label === "javascript") {
      return new tsWorker();
    }

    return new editorWorker();
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
  onChange?(value: string): void;
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
    onChange,
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
    });
  }, [container, value, readOnly, language]);

  useEffect(() => {
    if (!ide) {
      return;
    }

    if (onChange) {
      ide.current.onDidChangeModelContent(() => {
        onChange(ide.current.getModel().getValue());
      });
    }

    if (onFocus) {
      ide.current.onDidFocusEditorText(onFocus);
    }

    if (onBlur) {
      ide.current.onDidBlurEditorText(onBlur);
    }
  }, [onChange, onFocus, onBlur, ide]);

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
        my="5"
        ref={container}
      />
    </Box>
  );
}

export default forwardRef(MonacoEditor);

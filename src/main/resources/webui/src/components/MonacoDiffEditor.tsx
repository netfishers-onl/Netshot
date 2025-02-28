import colors from "@/theme/colors";
import { Box } from "@chakra-ui/react";
import { editor } from "monaco-editor";
import { useLayoutEffect, useRef } from "react";

editor.defineTheme("netshot", {
  base: "vs",
  inherit: true,
  colors: {
    "editor.background": colors.white,
    "editorLineNumber.foreground": colors.grey[400],
    "editor.selectionHighlightBackground": colors.green[100],
  },
  rules: [
    { token: "variable", foreground: colors.red[500] },
    { token: "constant", foreground: colors.red[500] },
  ],
});

export type MonacoDiffEditorProps = {
  language?: string;
  readOnly?: boolean;
  original: string;
  modified: string;
};

export default function MonacoDiffEditor(props: MonacoDiffEditorProps) {
  const {
    original,
    modified,
    readOnly = false,
    language = "typescript",
  } = props;
  const container = useRef<HTMLDivElement>(null);
  const ide = useRef<editor.IStandaloneDiffEditor>();

  useLayoutEffect(() => {
    if (!container?.current) return;

    ide.current = editor.createDiffEditor(container.current, {
      automaticLayout: true,
      readOnly,
      theme: "netshot",
      fontSize: 14,
      fontFamily: "SF Mono",
    });

    ide.current.setModel({
      original: editor.createModel(original, language),
      modified: editor.createModel(modified, language),
    });

    return () => {
      ide?.current?.dispose();
    };
  }, [container, original, modified, language, readOnly]);

  return <Box flex="1" ref={container} />;
}

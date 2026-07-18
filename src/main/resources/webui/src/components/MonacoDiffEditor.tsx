import { colors } from "@/theme/tokens/colors"
import { Box } from "@chakra-ui/react"
import { editor } from "monaco-editor"
import { useLayoutEffect, useRef } from "react"

editor.defineTheme("netshot", {
  base: "vs",
  inherit: true,
  colors: {
    "editor.background": colors.white.value,
    "editorLineNumber.foreground": colors.grey[400].value,
    "editor.selectionHighlightBackground": colors.green[100].value,
  },
  rules: [
    { token: "variable", foreground: colors.red[500].value },
    { token: "constant", foreground: colors.red[500].value },
  ],
})

export type MonacoDiffEditorProps = {
  language?: string
  readOnly?: boolean
  original: string
  modified: string
}

export default function MonacoDiffEditor(props: MonacoDiffEditorProps) {
  const { original, modified, readOnly = false, language = "typescript" } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<editor.IStandaloneDiffEditor>(null)

  useLayoutEffect(() => {
    if (!containerRef?.current) return

    editorRef.current = editor.createDiffEditor(containerRef.current, {
      automaticLayout: true,
      readOnly,
      theme: "netshot",
      fontSize: 14,
      fontFamily: "SF Mono",
    })

    editorRef.current.setModel({
      original: editor.createModel(original, language),
      modified: editor.createModel(modified, language),
    })

    return () => {
      editorRef?.current?.dispose()
    }
  }, [containerRef, original, modified, language, readOnly])

  return <Box flex="1" ref={containerRef} />
}

import { MonacoEditorControl } from "@/components"
import { DiagnosticType } from "@/types"
import { Stack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useFormContext } from "react-hook-form"
import { Form } from "../types"
import { DiagnosticEditForm } from "./DiagnosticEditForm"

export type DiagnosticEditScriptProps = {
  type: DiagnosticType
}

export default function DiagnosticEditScript(props: DiagnosticEditScriptProps) {
  const { type } = props
  const form = useFormContext<Form>()

  const language = useMemo(() => (type === DiagnosticType.Python ? "python" : "javascript"), [type])

  return (
    <Stack direction="row" gap="7" overflow="auto" flex="1">
      <Stack w="340px" overflow="auto">
        <DiagnosticEditForm type={type} />
      </Stack>
      <Stack flex="1">
        <MonacoEditorControl required control={form.control} name="script" language={language} />
      </Stack>
    </Stack>
  )
}

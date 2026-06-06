import { MonacoEditorControl } from "@/components"
import { DiagnosticType } from "@/types"
import { Stack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useFormContext } from "react-hook-form"
import { Form } from "../types"
import { EditDiagnosticForm } from "./EditDiagnosticForm"

export type EditDiagnosticScriptProps = {
  type: DiagnosticType
}

export default function EditDiagnosticScript(props: EditDiagnosticScriptProps) {
  const { type } = props
  const form = useFormContext<Form>()

  const language = useMemo(() => (type === DiagnosticType.Python ? "python" : "javascript"), [type])

  return (
    <Stack direction="row" gap="7" overflow="auto" flex="1">
      <Stack w="340px" overflow="auto">
        <EditDiagnosticForm type={type} />
      </Stack>
      <Stack flex="1">
        <MonacoEditorControl required control={form.control} name="script" language={language} />
      </Stack>
    </Stack>
  )
}

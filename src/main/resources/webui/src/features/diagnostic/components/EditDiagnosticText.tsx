import { DiagnosticType } from "@/types"
import { Separator, Stack } from "@chakra-ui/react"
import { EditDiagnosticForm } from "./EditDiagnosticForm"
import EditDiagnosticTextFields from "./EditDiagnosticTextFields"

export type EditDiagnosticTextProps = {
  type: DiagnosticType
}

export default function EditDiagnosticText(props: EditDiagnosticTextProps) {
  const { type } = props

  return (
    <Stack direction="row" overflow="auto" flex="1">
      <Stack w="340px" flexShrink={0} overflow="auto">
        <EditDiagnosticForm type={type} hideTextFields />
      </Stack>
      <Separator orientation="vertical" />
      <Stack flex="1" overflow="auto">
        <EditDiagnosticTextFields />
      </Stack>
    </Stack>
  )
}

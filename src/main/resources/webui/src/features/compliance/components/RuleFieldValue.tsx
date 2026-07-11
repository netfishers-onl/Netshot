import { Text } from "@chakra-ui/react"

export type RuleFieldValueProps = {
  value: string
  isRegExp?: boolean
}

export default function RuleFieldValue({ value, isRegExp }: RuleFieldValueProps) {
  if (!isRegExp) {
    return <Text>{value}</Text>
  }

  return (
    <Text>
      <Text as="span" color="green.400" fontWeight="bold" fontSize="lg">/</Text>
      {" "}
      {value}
      {" "}
      <Text as="span" color="green.400" fontWeight="bold" fontSize="lg">/</Text>
    </Text>
  )
}

import { Skeleton, Table, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useDiagnostic } from "../contexts"
import { useResultTypeOptions } from "../hooks"

export default function TextDiagnosticDetail() {
  const { diagnostic, isLoading } = useDiagnostic()
  const { t } = useTranslation()
  const resultTypeOptions = useResultTypeOptions()

  const resultTypeLabel = resultTypeOptions.options.find(
    (o) => o.value === diagnostic?.resultType
  )?.label

  const hasModifier =
    diagnostic?.modifierPattern && diagnostic?.modifierReplacement

  return (
    <Table.Root variant="line" size="sm">
      <Table.Body>
        <Table.Row>
          <Table.ColumnHeader w="220px" whiteSpace="nowrap">
            {t("device.type")}
          </Table.ColumnHeader>
          <Table.Cell>
            <Skeleton loading={isLoading}>
              <Text>{diagnostic?.deviceDriverDescription ?? t("common.any")}</Text>
            </Skeleton>
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.ColumnHeader>{t("network.cliMode")}</Table.ColumnHeader>
          <Table.Cell>
            <Skeleton loading={isLoading}>
              <Text fontFamily="mono">{diagnostic?.cliMode}</Text>
            </Skeleton>
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.ColumnHeader>{t("network.cliCommand")}</Table.ColumnHeader>
          <Table.Cell>
            <Skeleton loading={isLoading}>
              <Text fontFamily="mono">{diagnostic?.command}</Text>
            </Skeleton>
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.ColumnHeader>{t("common.resultType")}</Table.ColumnHeader>
          <Table.Cell>
            <Skeleton loading={isLoading}>
              <Text>{resultTypeLabel}</Text>
            </Skeleton>
          </Table.Cell>
        </Table.Row>
        {(hasModifier || isLoading) && (
          <>
            <Table.Row>
              <Table.ColumnHeader>{t("policy.rule.regexPattern")}</Table.ColumnHeader>
              <Table.Cell>
                <Skeleton loading={isLoading}>
                  <Text fontFamily="mono">{diagnostic?.modifierPattern}</Text>
                </Skeleton>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.ColumnHeader>{t("policy.rule.replaceWith")}</Table.ColumnHeader>
              <Table.Cell>
                <Skeleton loading={isLoading}>
                  <Text fontFamily="mono">{diagnostic?.modifierReplacement}</Text>
                </Skeleton>
              </Table.Cell>
            </Table.Row>
          </>
        )}
      </Table.Body>
    </Table.Root>
  )
}

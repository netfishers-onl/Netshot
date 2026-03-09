import { AttributeOption, AttributeType, OperatorOption, OperatorType } from "./types"
import { useOperatorMapping } from "./useOperatorMapping"

export function useQueryBuilderOperator() {
  const mapping = useOperatorMapping()

  function getAllOptionForText(attributeName: string) {
    return [
      {
        ...mapping[OperatorType.Is],
        callback: () => `[${attributeName}] IS "text"`,
      },
      {
        ...mapping[OperatorType.Contains],
        callback: () => `[${attributeName}] CONTAINS "text"`,
      },
      {
        ...mapping[OperatorType.ContainsNoCase],
        callback: () => `[${attributeName}] CONTAINSNOCASE "text"`,
      },
      {
        ...mapping[OperatorType.StartsWith],
        callback: () => `[${attributeName}] STARTSWITH "text"`,
      },
      {
        ...mapping[OperatorType.EndsWith],
        callback: () => `[${attributeName}] ENDSWITH "text"`,
      },
      {
        ...mapping[OperatorType.Matches],
        callback: () => `[${attributeName}] MATCHES "pattern"`,
      },
    ]
  }

  function getAllOptionForNumeric(attributeName: string) {
    return [
      {
        ...mapping[OperatorType.Is],
        callback: () => `[${attributeName}] IS 42`,
      },
      {
        ...mapping[OperatorType.LessThan],
        callback: () => `[${attributeName}] LESSTHAN 42`,
      },
      {
        ...mapping[OperatorType.GreaterThan],
        callback: () => `[${attributeName}] GREATERTHAN 42`,
      },
    ]
  }

  function getAllOptionForId(attributeName: string) {
    return [
      {
        ...mapping[OperatorType.Is],
        callback: () => `[${attributeName}] IS 42`,
      },
    ]
  }

  function getAllOptionForDate(attributeName: string) {
    return [
      {
        ...mapping[OperatorType.Is],
        callback: () => `[${attributeName}] IS "2023-01-01"`,
      },
      {
        ...mapping[OperatorType.Before],
        callback: () => `[${attributeName}] BEFORE "2023-01-01"`,
      },
      {
        ...mapping[OperatorType.After],
        callback: () => `[${attributeName}] AFTER "2023-01-01"`,
      },
      {
        ...mapping[OperatorType.BeforeRelative],
        callback: () => `[${attributeName}] BEFORE "NOW -1d"`,
      },
    ]
  }

  function getAllOptionForNetworkAddress(attributeName: string) {
    return [
      {
        ...mapping[OperatorType.Is],
        callback: () => `[${attributeName}] IS 16.16.16.16`,
      },
      {
        ...mapping[OperatorType.In],
        callback: () => `[${attributeName}] IN 16.16.0.0/16`,
      },
    ]
  }

  function getAllOptionForBinary(attributeName: string) {
    return [
      {
        ...mapping[OperatorType.True],
        callback: () => `[${attributeName}] IS TRUE`,
      },
      {
        ...mapping[OperatorType.False],
        callback: () => `[${attributeName}] IS FALSE`,
      },
    ]
  }

  function getAllOptionByAttribute(attribute: AttributeOption["value"]): OperatorOption[] {
    if (!attribute) {
      return []
    }

    if (attribute.type === AttributeType.Text || attribute.type === AttributeType.LongText) {
      return getAllOptionForText(attribute.name)
    } else if (attribute.type === AttributeType.Numeric) {
      return getAllOptionForNumeric(attribute.name)
    } else if (attribute.type === AttributeType.Id) {
      return getAllOptionForId(attribute.name)
    } else if (attribute.type === AttributeType.Date) {
      return getAllOptionForDate(attribute.name)
    } else if (
      attribute.type === AttributeType.MacAddress ||
      attribute.type === AttributeType.IpAddress
    ) {
      return getAllOptionForNetworkAddress(attribute.name)
    } else if (attribute.type === AttributeType.Binary) {
      return getAllOptionForBinary(attribute.name)
    } else {
      return []
    }
  }

  return {
    getAllOptionByAttribute,
    getAllOptionForText,
  }
}

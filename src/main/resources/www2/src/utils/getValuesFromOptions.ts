import { Option } from "@/types";

export function getValuesFromOptions<T>(options: Option<T>[]) {
  return options.map((option) => option.value);
}

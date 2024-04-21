export function getKeyByValue<E>(enumeration: E, value: string) {
  const indexOfS = Object.values(enumeration).indexOf(value as unknown as E);

  const key = Object.keys(enumeration)[indexOfS];

  return key;
}

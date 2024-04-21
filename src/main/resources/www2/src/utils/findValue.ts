type NestedObject = {
  children: NestedObject[];
};

export function findValue<T extends NestedObject, V>(
  arr: T[],
  key: string,
  value: V
) {
  for (let obj of arr) {
    if (obj[key] === value) {
      return obj;
    }

    if (obj.children) {
      let result = findValue(obj.children, key, value);
      if (result) {
        return result;
      }
    }
  }

  return undefined;
}

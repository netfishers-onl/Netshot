import "@tanstack/react-table";
import { RowData } from "@tanstack/react-table";

declare module "@tanstack/table-core" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- generic params must match the augmented interface's signature for declaration merging to apply
  interface ColumnMeta<TData extends RowData, TValue> {
    style: {
      align: "left" | "center" | "right";
    };
  }
}

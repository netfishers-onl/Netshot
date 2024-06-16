import {
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableContainer,
  TableContainerProps,
  TableRowProps,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import {
  ColumnDef,
  Row,
  RowModel,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Fragment, useCallback, useRef, useState } from "react";
import { DndProvider, XYCoord, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ArrowDown, ArrowUp } from "react-feather";
import { useTranslation } from "react-i18next";
import Icon from "./Icon";

type RowProps<T> = {
  row: Row<T>;
  rowModel: RowModel<T>;
} & TableRowProps;

type DraggableRowProps<T> = {
  dropped: (draggedRowIndex: number, targetRowIndex: number) => void;
  dragged: (draggedRowIndex: number, targetRowIndex: number) => void;
} & RowProps<T>;

function DraggableRow<T>(props: DraggableRowProps<T>) {
  const { t } = useTranslation();
  const { rowModel, row, dropped, dragged, ...other } = props;
  const ref = useRef<HTMLTableRowElement>(null);
  const [, drop] = useDrop({
    accept: "row",
    drop: (draggedRow: Row<T>) => dropped(draggedRow.index, row.index),
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = row.index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      dragged(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, dragRef, drag] = useDrag({
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    item: () => row,
    type: "row",
  });

  const cells = row.getVisibleCells();
  const last = row.index === rowModel.rows.length - 1;

  drag(drop(ref));

  return (
    <Tr
      borderRadius="xl"
      transition="all .2s ease"
      _hover={{
        bg: isDragging ? "white" : "green.50",
      }}
      ref={ref}
      sx={{
        opacity: isDragging ? 0.5 : 1,
      }}
      {...other}
    >
      <Td
        px="4"
        borderBottomWidth={last ? "0" : "1px"}
        borderColor="grey.100"
        overflow="hidden"
        textOverflow="ellipsis"
      >
        <IconButton
          aria-label={t("Drag the row")}
          icon={<Icon name="menu" />}
          ref={dragRef}
          variant="ghost"
          colorScheme="grey"
          cursor="move"
        />
      </Td>
      {cells.map((cell) => {
        const meta: any = cell.column.columnDef.meta;
        const render = flexRender(
          cell.column.columnDef.cell,
          cell.getContext()
        );

        return (
          <Td
            key={cell.id}
            px="4"
            isNumeric={meta?.isNumeric}
            borderBottomWidth={last ? "0" : "1px"}
            borderColor="grey.100"
            textAlign={meta?.align}
            position="relative"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {render}
          </Td>
        );
      })}
    </Tr>
  );
}

function SimpleRow<T>(props: RowProps<T>) {
  const { rowModel, row, ...other } = props;
  const cells = row.getVisibleCells();
  const last = row.index === rowModel.rows.length - 1;

  return (
    <Tr
      borderRadius="xl"
      transition="all .2s ease"
      _hover={{
        bg: "green.50",
      }}
      {...other}
    >
      {cells.map((cell) => {
        const meta: any = cell.column.columnDef.meta;
        const render = flexRender(
          cell.column.columnDef.cell,
          cell.getContext()
        );

        return (
          <Td
            key={cell.id}
            px="4"
            isNumeric={meta?.isNumeric}
            borderBottomWidth={last ? "0" : "1px"}
            borderColor="grey.100"
            textAlign={meta?.align}
            maxWidth="100px"
            wordBreak="break-word"
            whiteSpace="pre-wrap"
            position="relative"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {render}
          </Td>
        );
      })}
    </Tr>
  );
}

export type DataTableProps<Data extends object> = {
  data: Data[];
  columns: ColumnDef<Data, any>[];
  loading?: boolean;
  draggable?: boolean;
  onDropRow?(row: Row<Data>, data: Data[]): void;
  onDragRow?(row: Row<Data>, data: Data[]): void;
  onClickRow?(row: Data, data?: Data[]): void;
  primaryKey?: keyof Data;
} & TableContainerProps;

export default function DataTable<Data extends object>(
  props: DataTableProps<Data>
) {
  const {
    data,
    columns,
    loading,
    onDropRow,
    onDragRow,
    onClickRow,
    draggable = false,
    primaryKey,
    ...other
  } = props;
  const parentRef = useRef<HTMLDivElement>();
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    getRowId: (row, index) => {
      if (primaryKey) {
        return row[primaryKey] as string;
      }

      return index.toString();
    },
    defaultColumn: {
      minSize: 50,
      size: 100,
    },
  });

  const getReorderedData = useCallback(
    (draggedRowIndex: number, targetRowIndex: number) => {
      data.splice(
        targetRowIndex,
        0,
        data.splice(draggedRowIndex, 1)[0] as Data
      );

      return {
        row: data[draggedRowIndex] as Row<Data>,
        reorderedData: [...data],
      };
    },
    [data]
  );

  const handleDrop = useCallback(
    (draggedRowIndex: number, targetRowIndex: number) => {
      const { row, reorderedData } = getReorderedData(
        draggedRowIndex,
        targetRowIndex
      );

      if (onDropRow) onDropRow(row, reorderedData);
    },
    [getReorderedData, onDropRow]
  );

  const handleDrag = useCallback(
    (draggedRowIndex: number, targetRowIndex: number) => {
      const { row, reorderedData } = getReorderedData(
        draggedRowIndex,
        targetRowIndex
      );

      if (onDragRow) onDragRow(row, reorderedData);
    },
    [getReorderedData, onDragRow]
  );

  const headerGroups = table.getHeaderGroups();
  const rowModel = table.getRowModel();

  return (
    <DndProvider backend={HTML5Backend}>
      <TableContainer
        position="relative"
        overflowY="scroll"
        width="100%"
        borderRadius="xl"
        display="flex"
        flexDirection="column"
        borderColor="grey.100"
        borderWidth="1px"
        {...other}
      >
        <Table flex="1" layout="fixed">
          <Thead
            position="sticky"
            top="0"
            zIndex="1"
            bg="white"
            borderBottom="0"
            boxShadow="inset 0 -1px 0 #EAEEF2"
          >
            {headerGroups?.map((headerGroup) => (
              <Tr key={headerGroup.id}>
                {draggable && <Th borderColor="grey.100"></Th>}
                {headerGroup?.headers.map((header) => {
                  const meta: any = header?.column?.columnDef?.meta;
                  const isSortable = header?.column?.columnDef?.enableSorting;
                  const isSorted = header?.column?.getIsSorted();

                  return (
                    <Th
                      key={header.id}
                      onClick={header?.column?.getToggleSortingHandler()}
                      isNumeric={meta?.isNumeric}
                      borderColor="grey.100"
                      position="relative"
                      cursor="pointer"
                      textTransform="initial"
                      fontSize="md"
                      fontWeight="400"
                      color="grey.500"
                      letterSpacing="0"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      h="40px"
                      px="4"
                      py="0"
                      sx={{
                        "&:hover": {
                          button: {
                            opacity: 1,
                          },
                        },
                      }}
                      maxWidth="100px"
                    >
                      {flexRender(
                        header?.column?.columnDef?.header,
                        header?.getContext()
                      )}

                      {isSortable && (
                        <IconButton
                          position="absolute"
                          top="0"
                          bottom="0"
                          right="0"
                          display="flex"
                          alignItems="center"
                          transition="all .2s ease"
                          opacity={isSorted ? 1 : 0}
                          aria-label={
                            isSorted === "desc"
                              ? "sorted descending"
                              : "sorted ascending"
                          }
                          variant="link"
                          icon={
                            isSorted === "desc" ? <ArrowDown /> : <ArrowUp />
                          }
                        />
                      )}
                    </Th>
                  );
                })}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {rowModel.rows.map((row) => (
              <Fragment key={row.id}>
                {draggable ? (
                  <DraggableRow
                    rowModel={rowModel}
                    row={row}
                    dropped={handleDrop}
                    dragged={handleDrag}
                  />
                ) : (
                  <SimpleRow
                    rowModel={rowModel}
                    row={row}
                    onClick={() => onClickRow?.(row.original, data)}
                    cursor="pointer"
                  />
                )}
              </Fragment>
            ))}
          </Tbody>
        </Table>
        {loading && (
          <Stack mt="2">
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
          </Stack>
        )}
      </TableContainer>
    </DndProvider>
  );
}

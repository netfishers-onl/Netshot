import {
  IconButton,
  Skeleton,
  Stack,
  SystemStyleObject,
  Table,
  TableRootProps,
  TableRowProps,
} from "@chakra-ui/react"
import {
  ColumnDef,
  Header,
  Row,
  SortingState,
  Table as TanstackTable,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { VirtualItem, Virtualizer, useVirtualizer } from "@tanstack/react-virtual"
import { RefObject, useCallback, useEffect, useRef, useState } from "react"
import { DndProvider, XYCoord, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { useTranslation } from "react-i18next"
import Icon from "./Icon"

type DataTableColumnMeta = {
  isNumeric?: boolean
  align?: SystemStyleObject["textAlign"]
}

type RowProps<T> = {
  row: Row<T>
  virtualRow: VirtualItem
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>
} & TableRowProps

type DraggableRowProps<T> = {
  dropped: (draggedRowIndex: number, targetRowIndex: number) => void
  dragged: (draggedRowIndex: number, targetRowIndex: number) => void
} & RowProps<T>

function DraggableRow<T>(props: DraggableRowProps<T>) {
  const { t } = useTranslation()
  const { row, dropped, dragged, virtualRow, rowVirtualizer, ...other } = props
  const ref = useRef<HTMLTableRowElement>(null)
  const [, drop] = useDrop({
    accept: "row",
    drop: (draggedRow: Row<T>) => dropped(draggedRow.index, row.index),
    hover(item, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = row.index

      if (dragIndex === hoverIndex) {
        return
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      dragged(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
  })

  const [{ isDragging }, dragRef, drag] = useDrag({
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    item: () => row,
    type: "row",
  })

  const cells = row.getVisibleCells()

  drag(drop(ref))

  return (
    <Table.Row
      transition="all .2s ease"
      _hover={{
        bg: isDragging ? "white" : "green.50",
      }}
      css={{
        opacity: isDragging ? 0.5 : 1,
      }}
      borderColor="grey.100"
      _notLast={{
        borderBottomWidth: "1px",
      }}
      data-index={virtualRow.index}
      ref={(node) => {
        rowVirtualizer.measureElement(node)
        ref.current = node
      }}
      display="flex"
      position="absolute"
      w="100%"
      style={{
        transform: `translateY(${virtualRow.start}px)`,
      }}
      {...other}
    >
      <Table.Cell px="4" overflow="hidden" textOverflow="ellipsis" py="3" borderWidth="0">
        <IconButton
          aria-label={t("Drag the row")}
          ref={(node) => {
            dragRef(node)
          }}
          variant="ghost"
          colorPalette="grey"
          cursor="move"
        >
          <Icon name="menu" />
        </IconButton>
      </Table.Cell>
      {cells.map((cell) => {
        const meta = cell.column.columnDef.meta as DataTableColumnMeta

        const render = flexRender(cell.column.columnDef.cell, cell.getContext())

        return (
          <Table.Cell
            key={cell.id}
            px="4"
            textAlign={meta?.align}
            position="relative"
            overflow="hidden"
            textOverflow="ellipsis"
            py="3"
            borderWidth="0"
            display="flex"
            style={{
              width: cell.column.getSize(),
            }}
          >
            {render}
          </Table.Cell>
        )
      })}
    </Table.Row>
  )
}

function SimpleRow<T>(props: RowProps<T>) {
  const { row, rowVirtualizer, virtualRow, ...other } = props
  const cells = row.getVisibleCells()

  return (
    <Table.Row
      transition="background-color .2s ease"
      _hover={{
        bg: "green.50",
      }}
      lineHeight="3"
      borderBottom="1px solid {colors.grey.100}"
      _last={{
        borderBottomWidth: "0px",
      }}
      data-index={virtualRow.index}
      ref={(node) => rowVirtualizer.measureElement(node)}
      display="flex"
      position="absolute"
      w="100%"
      style={{
        transform: `translateY(${virtualRow.start}px)`,
      }}
      {...other}
    >
      {cells.map((cell) => {
        const meta = cell.column.columnDef.meta as DataTableColumnMeta
        const render = flexRender(cell.column.columnDef.cell, cell.getContext())

        return (
          <Table.Cell
            key={cell.id}
            px="4"
            textAlign={meta?.align}
            wordBreak="break-word"
            position="relative"
            overflow="hidden"
            textOverflow="ellipsis"
            borderBottomWidth={0}
            py="3"
            borderWidth="0"
            display="flex"
            style={{
              width: cell.column.getSize(),
            }}
          >
            {render}
          </Table.Cell>
        )
      })}
    </Table.Row>
  )
}

export type VirtualizedDataTableProps<Data extends object> = {
  data: Data[]
  columns: ColumnDef<Data, unknown>[]
  loading?: boolean
  draggable?: boolean
  onDropRow?(row: Row<Data>, data: Data[]): void
  onDragRow?(row: Row<Data>, data: Data[]): void
  onClickRow?(row: Data, data?: Data[]): void
  onBottomReached?(): void
  primaryKey?: keyof Data
} & TableRootProps

export function VirtualizedDataTable<Data extends object>(props: VirtualizedDataTableProps<Data>) {
  const {
    data,
    columns,
    loading,
    onDropRow,
    onDragRow,
    onClickRow,
    onBottomReached,
    draggable = false,
    primaryKey,
    ...other
  } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const [sorting, setSorting] = useState<SortingState>([])

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
        return row[primaryKey] as string
      }

      return index.toString()
    },
    defaultColumn: {
      minSize: 50,
    },
  })

  const onScroll = useCallback(
    (el?: HTMLDivElement | null) => {
      if (!onBottomReached) {
        return
      }

      if (el) {
        const { scrollHeight, scrollTop, clientHeight } = el

        if (scrollHeight - scrollTop - clientHeight < 500) {
          onBottomReached()
        }
      }
    },
    [onBottomReached]
  )

  return (
    <DndProvider backend={HTML5Backend}>
      <Table.ScrollArea
        position="relative"
        overflowY="auto"
        width="100%"
        borderRadius="xl"
        display="flex"
        flexDirection="column"
        borderColor="grey.100"
        borderWidth="1px"
        onScroll={(e) => onScroll(e.target as HTMLDivElement)}
        ref={containerRef}
        {...other}
      >
        <Table.Root flex="1" display="grid">
          <VirtualizedDataTableHeader table={table} draggable={draggable} />
          <VirtualizedDataTableBody
            table={table}
            containerRef={containerRef}
            draggable={draggable}
            data={data}
            onDropRow={onDropRow}
            onDragRow={onDragRow}
            onClickRow={onClickRow}
          />
        </Table.Root>
        {loading && (
          <Stack mt="2">
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
          </Stack>
        )}
      </Table.ScrollArea>
    </DndProvider>
  )
}

export function VirtualizedDataTableHeader<T>({
  table,
  draggable,
}: {
  table: TanstackTable<T>
  draggable: boolean
}) {
  const { t } = useTranslation()
  const headerGroups = table.getHeaderGroups()

  return (
    <Table.Header
      position="sticky"
      top="0"
      zIndex="1"
      bg="white"
      borderBottom="0"
      boxShadow="inset 0 -1px 0 #EAEEF2"
    >
      {headerGroups?.map((headerGroup) => (
        <Table.Row key={headerGroup.id}>
          {draggable && <Table.ColumnHeader borderColor="grey.100"></Table.ColumnHeader>}
          {headerGroup?.headers.map((header: Header<T, unknown>) => {
            const columnDef = header?.column?.columnDef
            const isSortable = columnDef?.enableSorting
            const isSorted = header?.column?.getIsSorted()
            const meta = columnDef?.meta as DataTableColumnMeta

            return (
              <Table.ColumnHeader
                key={header.id}
                onClick={isSortable ? header?.column?.getToggleSortingHandler() : null}
                borderColor="grey.100"
                position="relative"
                cursor="pointer"
                textTransform="initial"
                fontSize="sm"
                fontWeight="400"
                color="grey.500"
                letterSpacing="0"
                overflow="hidden"
                textOverflow="ellipsis"
                h="40px"
                px="4"
                py="0"
                textAlign={meta?.align}
                width={columnDef?.size && `${columnDef?.size}px`}
                maxWidth={columnDef?.maxSize && `${columnDef?.maxSize}px`}
                minWidth={columnDef?.minSize && `${columnDef?.minSize}px`}
              >
                {flexRender(header?.column?.columnDef?.header, header?.getContext())}
                {isSortable && (
                  <IconButton
                    position="absolute"
                    top="0"
                    bottom="0"
                    right="0"
                    display="flex"
                    alignItems="center"
                    transition="all .2s ease"
                    opacity={isSorted ? "1 !important" : 0}
                    aria-label={
                      isSorted === "desc" ? t("sorted descending") : t("sorted ascending")
                    }
                  >
                    <Icon name={isSorted === "desc" ? "arrowDown" : "arrowUp"} />
                  </IconButton>
                )}
              </Table.ColumnHeader>
            )
          })}
        </Table.Row>
      ))}
    </Table.Header>
  )
}

export function VirtualizedDataTableBody<T>({
  table,
  containerRef,
  draggable,
  data,
  onDropRow,
  onDragRow,
  onClickRow,
}: {
  table: TanstackTable<T>
  containerRef: RefObject<HTMLDivElement>
  draggable: boolean
  data: T[]
  onDropRow?(row: Row<T>, data: T[]): void
  onDragRow?(row: Row<T>, data: T[]): void
  onClickRow?(row: T, data?: T[]): void
}) {
  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => 43,
    getScrollElement: () => containerRef.current,
    measureElement: (element) => element?.getBoundingClientRect().height + 2,
    overscan: 10,
  })

  const getReorderedData = (draggedRowIndex: number, targetRowIndex: number) => {
    data.splice(targetRowIndex, 0, data.splice(draggedRowIndex, 1)[0] as T)

    return {
      row: data[draggedRowIndex] as Row<T>,
      reorderedData: [...data],
    }
  }

  const handleDrop = (draggedRowIndex: number, targetRowIndex: number) => {
    const { row, reorderedData } = getReorderedData(draggedRowIndex, targetRowIndex)

    if (onDropRow) onDropRow(row, reorderedData)
  }

  const handleDrag = (draggedRowIndex: number, targetRowIndex: number) => {
    const { row, reorderedData } = getReorderedData(draggedRowIndex, targetRowIndex)

    if (onDragRow) onDragRow(row, reorderedData)
  }

  useEffect(() => {
    rowVirtualizer.measure()
  }, [rowVirtualizer])

  const virtualRows = rowVirtualizer.getVirtualItems()

  return (
    <Table.Body
      display="grid"
      position="relative"
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
      }}
    >
      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index] as Row<T>

        if (draggable) {
          return (
            <DraggableRow
              key={row.id}
              row={row}
              virtualRow={virtualRow}
              rowVirtualizer={rowVirtualizer}
              dropped={handleDrop}
              dragged={handleDrag}
            />
          )
        }

        return (
          <SimpleRow
            key={row.id}
            row={row}
            virtualRow={virtualRow}
            rowVirtualizer={rowVirtualizer}
            onClick={() => onClickRow?.(row.original, data)}
            cursor="pointer"
          />
        )
      })}
    </Table.Body>
  )
}

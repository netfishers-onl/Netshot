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
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { RefObject, useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuArrowDown, LuArrowUp, LuMenu } from "react-icons/lu"

type DataTableColumnMeta = {
  isNumeric?: boolean
  align?: SystemStyleObject["textAlign"]
}

type RowProps<T> = {
  row: Row<T>
  virtualRow: VirtualItem
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>
} & TableRowProps

type DraggableRowProps<T> = RowProps<T>

function DraggableRow<T>(props: DraggableRowProps<T>) {
  const { t } = useTranslation()
  const { row, virtualRow, rowVirtualizer, ...other } = props

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useSortable({
    id: row.id,
  })

  const cells = row.getVisibleCells()

  return (
    <Table.Row
      ref={(node) => {
        setNodeRef(node)
        rowVirtualizer.measureElement(node)
      }}
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
      display="flex"
      position="absolute"
      w="100%"
      style={{
        transform: `translateY(${virtualRow.start + (transform?.y ?? 0)}px)`,
      }}
      {...other}
    >
      <Table.Cell px="4" overflow="hidden" textOverflow="ellipsis" py="3" borderWidth="0">
        <IconButton
          aria-label={t("common.dragTheRow")}
          ref={setActivatorNodeRef}
          variant="ghost"
          colorPalette="grey"
          cursor="move"
          {...listeners}
          {...attributes}
        >
          <LuMenu />
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
            flex={`${cell.column.getSize()} ${cell.column.getSize()} 0`}
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
            flex={`${cell.column.getSize()} ${cell.column.getSize()} 0`}
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
        return String(row[primaryKey])
      }

      return index.toString()
    },
    defaultColumn: {
      minSize: 50,
    },
  })

  const { rows } = table.getRowModel()
  const rowIds = rows.map((r) => r.id)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeRow = rows.find((r) => String(r.id) === String(active.id))
    const overRow = rows.find((r) => String(r.id) === String(over.id))

    if (!activeRow || !overRow) return

    const activeIndex = activeRow.index
    const overIndex = overRow.index

    data.splice(overIndex, 0, data.splice(activeIndex, 1)[0] as Data)
    const reorderedData = [...data]

    if (onDragRow) onDragRow(activeRow, reorderedData)
    if (onDropRow) onDropRow(activeRow, reorderedData)
  }

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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
          <Table.Root flex="1" display="grid">
            <VirtualizedDataTableHeader table={table} draggable={draggable} />
            <VirtualizedDataTableBody
              table={table}
              containerRef={containerRef}
              draggable={draggable}
              data={data}
              onClickRow={onClickRow}
            />
          </Table.Root>
        </SortableContext>
      </DndContext>
      {loading && (
        <Stack mt="2">
          <Skeleton height="40px" />
          <Skeleton height="40px" />
          <Skeleton height="40px" />
        </Stack>
      )}
    </Table.ScrollArea>
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
        <Table.Row key={headerGroup.id} display="flex">
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
                display="flex"
                alignItems="center"
                textAlign={meta?.align}
                flex={`${header.column.getSize()} ${header.column.getSize()} 0`}
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
                      isSorted === "desc" ? t("common.sortedDescending") : t("common.sortedAscending")
                    }
                  >
                    {isSorted === "desc" ? <LuArrowDown /> : <LuArrowUp />}
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
  onClickRow,
}: {
  table: TanstackTable<T>
  containerRef: RefObject<HTMLDivElement>
  draggable: boolean
  data: T[]
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
            <DraggableRow key={row.id} row={row} virtualRow={virtualRow} rowVirtualizer={rowVirtualizer} />
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

import {
  chakra,
  Icon,
  IconButton,
  Skeleton,
  Stack,
  SystemStyleObject,
  Table,
  TableRootProps,
  TableRowProps,
} from "@chakra-ui/react"
import { Tooltip } from "@/components/ui/tooltip"
import {
  ColumnDef,
  Header,
  Row,
  RowModel,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Fragment, useCallback, useEffect, useRef, useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuArrowDown, LuArrowUp, LuGripVertical } from "react-icons/lu"

type DataTableColumnMeta = {
  isNumeric?: boolean
  align?: SystemStyleObject["textAlign"]
}

type RowProps<T> = {
  row: Row<T>
  rowModel: RowModel<T>
} & TableRowProps

type DraggableRowProps<T> = RowProps<T>

function DraggableRow<T>(props: DraggableRowProps<T>) {
  const { t } = useTranslation()
  const { row, rowModel: _rowModel, ...other } = props

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  })

  const cells = row.getVisibleCells()

  return (
    <Table.Row
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      transition="all .2s ease"
      _hover={{
        bg: isDragging ? undefined : "gray.50",
      }}
      css={{
        userSelect: "none",
        opacity: isDragging ? 0.5 : 1,
      }}
      borderColor="grey.100"
      _notLast={{
        borderBottomWidth: "1px",
      }}
      {...other}
    >
      <Table.Cell overflow="hidden" textOverflow="ellipsis" py="3" borderWidth="0">
        <Tooltip content={t("common.dragTheRow")}>
          <chakra.span
            ref={setActivatorNodeRef}
            aria-label={t("common.dragTheRow")}
            cursor="move"
            color="green.400"
            _hover={{ color: "green.600" }}
            _active={{ color: "green.300" }}
            {...listeners}
            {...attributes}
          >
            <LuGripVertical size={16} />
          </chakra.span>
        </Tooltip>
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
          >
            {render}
          </Table.Cell>
        )
      })}
    </Table.Row>
  )
}

function SimpleRow<T>(props: RowProps<T>) {
  const { row, rowModel: _rowModel, ...other } = props
  const cells = row.getVisibleCells()

  return (
    <Table.Row
      borderRadius="xl"
      transition="all .2s ease"
      _hover={{
        bg: "grey.50",
      }}
      lineHeight="3"
      borderColor="grey.100"
      _notLast={{
        borderBottomWidth: "1px",
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
          >
            {render}
          </Table.Cell>
        )
      })}
    </Table.Row>
  )
}

export type DataTableProps<Data extends object> = {
  data: Data[]
  columns: ColumnDef<Data, unknown>[]
  loading?: boolean
  draggable?: boolean
  onDropRow?(row: Row<Data>, data: Data[]): void
  onDragRow?(row: Row<Data>, data: Data[]): void
  onClickRow?(row: Data, data?: Data[]): void
  onBottomReached?(): void
  primaryKey?: keyof Data
} & Omit<TableRootProps, "columns">

export default function DataTable<Data extends object>(props: DataTableProps<Data>) {
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
  const [internalData, setInternalData] = useState<Data[]>(() => [...data])
  const { t } = useTranslation()

  useEffect(() => {
    setInternalData([...data])
  }, [data])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const table = useReactTable({
    columns,
    data: internalData,
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

  const rowModel = table.getRowModel()

  const handleDragEnd = useCallback(
    (event: DragEndEvent): void => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const rows = rowModel.rows
      const activeRow = rows.find((r) => String(r.id) === String(active.id))
      const overRow = rows.find((r) => String(r.id) === String(over.id))

      if (!activeRow || !overRow) return

      const activeIndex = activeRow.index
      const overIndex = overRow.index

      const reorderedData = [...internalData]
      reorderedData.splice(overIndex, 0, reorderedData.splice(activeIndex, 1)[0] as Data)

      setInternalData(reorderedData)

      if (onDragRow) onDragRow(activeRow, reorderedData)
      if (onDropRow) onDropRow(activeRow, reorderedData)
    },
    [internalData, rowModel, onDragRow, onDropRow]
  )

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

  const headerGroups = table.getHeaderGroups()
  const rowIds = rowModel.rows.map((row) => row.id)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
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
        <Table.Root flex="1">
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
                {headerGroup?.headers.map((header: Header<Data, unknown>) => {
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
                      cursor={isSortable ? "pointer" : undefined}
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
                          variant="frame"
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
          <Table.Body>
            <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
              {rowModel.rows.map((row) => (
                <Fragment key={row.id}>
                  {draggable ? (
                    <DraggableRow rowModel={rowModel} row={row} />
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
            </SortableContext>
          </Table.Body>
        </Table.Root>
        {loading && (
          <Stack mt="2">
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
          </Stack>
        )}
      </Table.ScrollArea>
    </DndContext>
  )
}

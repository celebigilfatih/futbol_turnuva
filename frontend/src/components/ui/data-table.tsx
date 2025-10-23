"use client"

import * as React from "react"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  getFilteredRowModel,
  ColumnFiltersState,
  FilterFn,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  rowClassName?: (row: TData) => string
  searchPosition?: 'left' | 'right'
  hideSearch?: boolean
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  rowClassName,
  searchPosition = 'left',
  hideSearch = false,
  globalFilter,
  onGlobalFilterChange
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [localGlobalFilter, setLocalGlobalFilter] = React.useState<string>("")
  const [{ pageIndex, pageSize }, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: (value) => {
      setLocalGlobalFilter(value);
      onGlobalFilterChange?.(value);
    },
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
      columnFilters,
      globalFilter: globalFilter ?? localGlobalFilter,
    },
    pageCount: Math.ceil(data.length / pageSize),
    manualPagination: false,
    filterFns: {
      custom: (row, id, value, addMeta) => {
        const column = columns.find(col => (col.id || ('accessorKey' in col && col.accessorKey)) === id)
        if (column && 'filterFn' in column) {
          return (column.filterFn as FilterFn<TData>)(row, id, value, addMeta)
        }
        return true
      }
    },
  })

  // Reset page index when filter changes
  React.useEffect(() => {
    table.setPageIndex(0)
  }, [globalFilter, localGlobalFilter, table])

  return (
    <div>
      {!hideSearch && (
        <div className={`flex items-center py-4 ${searchPosition === 'right' ? 'justify-end' : 'justify-start'}`}>
          <Input
            placeholder="Ara..."
            value={globalFilter ?? localGlobalFilter ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              setLocalGlobalFilter(value);
              onGlobalFilterChange?.(value);
            }}
            className="max-w-sm"
          />
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-green-50 dark:bg-green-950">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-green-100/50 dark:hover:bg-green-900/50">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={rowClassName ? rowClassName(row.original as TData) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Sonuç bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Sayfa başına satır
          </p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex w-[100px] items-center justify-center text-sm text-muted-foreground">
            Sayfa {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Önceki
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  )
}
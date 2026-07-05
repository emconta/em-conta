import type { ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDownIcon, SearchIcon } from "lucide-react";
import * as React from "react";
import { Input } from "@web/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@web/components/ui/select";
import { cn } from "@web/lib/utils";

export type DataTableFilter = {
  id: string;
  label: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
};

type DataTableProps<TData> = {
  actions?: React.ReactNode;
  columns: ColumnDef<TData>[];
  data: TData[];
  emptyMessage?: string;
  filters?: DataTableFilter[];
  getRowId?: (row: TData, index: number) => string;
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
  searchPlaceholder?: string;
};

export function DataTable<TData>({
  actions,
  columns,
  data,
  emptyMessage = "Nenhum registro encontrado.",
  filters = [],
  getRowId,
  isLoading = false,
  onRowClick,
  searchPlaceholder = "Buscar...",
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: { globalFilter },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1 md:max-w-sm">
            <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar na tabela"
              className="pl-8"
              value={globalFilter}
              placeholder={searchPlaceholder}
              onChange={(event) => setGlobalFilter(event.target.value)}
            />
          </div>

          {filters.map((filter) => (
            <div key={filter.id} className="flex flex-col gap-1 md:min-w-42">
              <span className="text-xs font-medium text-muted-foreground">{filter.label}</span>
              <Select value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger size="sm" className="w-full" aria-label={filter.label}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-sm">
            <thead className="bg-muted/70 text-xs text-muted-foreground uppercase tracking-wide">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 text-left font-medium">
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-1.5",
                            header.column.getCanSort() && "hover:text-foreground",
                          )}
                          disabled={!header.column.getCanSort()}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() ? <ArrowUpDownIcon className="size-3" /> : null}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={columns.length}>
                    Carregando...
                  </td>
                </tr>
              ) : null}
              {!isLoading && table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={columns.length}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : null}
              {!isLoading
                ? table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-t transition-colors hover:bg-muted/50",
                        onRowClick && "cursor-pointer",
                      )}
                      onClick={() => onRowClick?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {table.getFilteredRowModel().rows.length} de {data.length} registro(s)
      </div>
    </div>
  );
}

export type { ColumnDef } from "@tanstack/react-table";

/**
 * Data Table Component
 * Advanced table component with sorting, filtering, and pagination
 */

"use client";

import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Download,
	Filter,
	Search,
	Settings2,
	X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	searchPlaceholder?: string;
	searchKey?: string;
	onRowClick?: (row: TData) => void;
	className?: string;
	showColumnToggle?: boolean;
	showExport?: boolean;
	showPagination?: boolean;
	pageSize?: number;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	searchPlaceholder = "Search...",
	searchKey,
	onRowClick,
	className,
	showColumnToggle = true,
	showExport = false,
	showPagination = true,
	pageSize = 10,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [globalFilter, setGlobalFilter] = useState("");

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: "includesString",
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			globalFilter,
		},
		initialState: {
			pagination: {
				pageSize,
			},
		},
	});

	const getSortIcon = (column: any) => {
		if (!column.getCanSort()) return null;

		const sorted = column.getIsSorted();
		if (sorted === "asc") return <ArrowUp className="h-4 w-4" />;
		if (sorted === "desc") return <ArrowDown className="h-4 w-4" />;
		return <ArrowUpDown className="h-4 w-4" />;
	};

	const exportToCSV = () => {
		const headers = columns
			.filter((col) => col.id !== "actions")
			.map((col) => col.id || "")
			.join(",");

		const rows = table
			.getFilteredRowModel()
			.rows.map((row) =>
				columns
					.filter((col) => col.id !== "actions")
					.map((col) => {
						const value = row.getValue(col.id || "");
						return typeof value === "string" ? `"${value}"` : value;
					})
					.join(","),
			)
			.join("\n");

		const csv = `${headers}\n${rows}`;
		const blob = new Blob([csv], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "data.csv";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	};

	return (
		<div className={cn("space-y-4", className)}>
			{/* Toolbar */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					{/* Global Search */}
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={searchPlaceholder}
							value={globalFilter}
							onChange={(e) => setGlobalFilter(e.target.value)}
							className="w-[250px] pl-10"
						/>
						{globalFilter && (
							<Button
								variant="ghost"
								size="sm"
								className="-translate-y-1/2 absolute top-1/2 right-1 h-6 w-6 p-0"
								onClick={() => setGlobalFilter("")}
							>
								<X className="h-3 w-3" />
							</Button>
						)}
					</div>

					{/* Active Filters */}
					{columnFilters.length > 0 && (
						<div className="flex items-center space-x-2">
							<Badge
								variant="secondary"
								className="flex items-center space-x-1"
							>
								<Filter className="h-3 w-3" />
								<span>{columnFilters.length} filter(s)</span>
								<Button
									variant="ghost"
									size="sm"
									className="ml-1 h-4 w-4 p-0"
									onClick={() => setColumnFilters([])}
								>
									<X className="h-3 w-3" />
								</Button>
							</Badge>
						</div>
					)}
				</div>

				<div className="flex items-center space-x-2">
					{/* Export Button */}
					{showExport && (
						<Button variant="outline" size="sm" onClick={exportToCSV}>
							<Download className="mr-2 h-4 w-4" />
							Export
						</Button>
					)}

					{/* Column Toggle */}
					{showColumnToggle && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm">
									<Settings2 className="mr-2 h-4 w-4" />
									Columns
									<ChevronDown className="ml-2 h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-[200px]">
								{table
									.getAllColumns()
									.filter((column) => column.getCanHide())
									.map((column) => (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value) =>
												column.toggleVisibility(!!value)
											}
										>
											{column.id}
										</DropdownMenuCheckboxItem>
									))}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>

			{/* Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id} className="px-4 py-3">
										{header.isPlaceholder ? null : (
											<div
												className={cn(
													"flex items-center space-x-2",
													header.column.getCanSort() &&
														"cursor-pointer select-none hover:text-foreground",
												)}
												onClick={header.column.getToggleSortingHandler()}
											>
												<span>
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
												</span>
												{getSortIcon(header.column)}
											</div>
										)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									className={cn(
										onRowClick && "cursor-pointer hover:bg-muted/50",
									)}
									onClick={() => onRowClick?.(row.original)}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="px-4 py-3">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center text-muted-foreground"
								>
									No results found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{showPagination && (
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<p className="text-muted-foreground text-sm">
							Showing{" "}
							{table.getState().pagination.pageIndex *
								table.getState().pagination.pageSize +
								1}{" "}
							to{" "}
							{Math.min(
								(table.getState().pagination.pageIndex + 1) *
									table.getState().pagination.pageSize,
								table.getFilteredRowModel().rows.length,
							)}{" "}
							of {table.getFilteredRowModel().rows.length} results
						</p>
					</div>

					<div className="flex items-center space-x-2">
						<div className="flex items-center space-x-2">
							<p className="font-medium text-sm">Rows per page</p>
							<Select
								value={`${table.getState().pagination.pageSize}`}
								onValueChange={(value) => {
									table.setPageSize(Number(value));
								}}
							>
								<SelectTrigger className="h-8 w-[70px]">
									<SelectValue
										placeholder={table.getState().pagination.pageSize}
									/>
								</SelectTrigger>
								<SelectContent side="top">
									{[10, 20, 30, 40, 50].map((pageSize) => (
										<SelectItem key={pageSize} value={`${pageSize}`}>
											{pageSize}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.setPageIndex(0)}
								disabled={!table.getCanPreviousPage()}
							>
								<ChevronsLeft className="h-4 w-4" />
								<span className="sr-only">First page</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								<ChevronLeft className="h-4 w-4" />
								<span className="sr-only">Previous page</span>
							</Button>

							<div className="flex items-center space-x-1">
								<p className="font-medium text-sm">
									Page {table.getState().pagination.pageIndex + 1} of{" "}
									{table.getPageCount()}
								</p>
							</div>

							<Button
								variant="outline"
								size="sm"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								<ChevronRight className="h-4 w-4" />
								<span className="sr-only">Next page</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.setPageIndex(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}
							>
								<ChevronsRight className="h-4 w-4" />
								<span className="sr-only">Last page</span>
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

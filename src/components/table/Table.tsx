"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
	columnFilteringFeature,
	ColumnDef,
	ColumnFiltersState,
	columnSizingFeature,
	columnVisibilityFeature,
	createFilteredRowModel,
	createPaginatedRowModel,
	createSortedRowModel,
	flexRender,
	globalFilteringFeature,
	PaginationState,
	rowPaginationFeature,
	Row,
	RowData,
	rowSortingFeature,
	sortFn_alphanumeric,
	SortingState,
	tableFeatures as createTableFeatures,
	ReactTable,
	useTable,
} from "@tanstack/react-table";
import CancelIcon from "@mui/icons-material/Cancel";
import SearchIcon from "@mui/icons-material/Search";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import FirstPage from "@mui/icons-material/FirstPage";
import LastPage from "@mui/icons-material/LastPage";
import NavigateNext from "@mui/icons-material/NavigateNext";
import NavigateBefore from "@mui/icons-material/NavigateBefore";
import { defaultCustomFilterFn, createGlobalFilterFn } from "@/utils/tableFilters";

const features = createTableFeatures({
	columnFilteringFeature,
	columnSizingFeature,
	columnVisibilityFeature,
	globalFilteringFeature,
	rowSortingFeature,
	rowPaginationFeature,
	filteredRowModel: createFilteredRowModel(),
	sortFns: {
		alphanumeric: sortFn_alphanumeric,
	},
	sortedRowModel: createSortedRowModel(),
	paginatedRowModel: createPaginatedRowModel(),
});

export type WikiTableFeatures = typeof features;
export type WikiTableColumnDef<TData extends RowData> = ColumnDef<
	WikiTableFeatures,
	TData,
	unknown
>;

interface SortIndicatorArrowProps {
	direction: "up" | "down";
	active: boolean;
}

function SortIndicatorArrow({ direction, active }: SortIndicatorArrowProps) {
	const isUp = direction === "up";
	return (
		<svg
			className={`w-3 h-3 ${active ? "text-blue-600" : "text-gray-400"} ${isUp ? "mb-[1px]" : ""}`}
			viewBox="0 0 16 8"
			fill="currentColor"
		>
			<path d={isUp ? "M8 0L16 8H0z" : "M8 8L0 0h16z"} />
		</svg>
	);
}

const PAGE_SIZE_OPTIONS = [500, 200, 100, 50, 20];
const DEFAULT_PAGE_SIZE = 100;
const MIN_PAGE_SIZE = Math.min(...PAGE_SIZE_OPTIONS);

interface PaginationButtonProps {
	onClick: () => void;
	disabled: boolean;
	icon: React.ReactNode;
}

function PaginationButton({ onClick, disabled, icon }: PaginationButtonProps) {
	return (
		<IconButton size="small" onClick={onClick} disabled={disabled}>
			{icon}
		</IconButton>
	);
}

interface SortableTableProps<TData extends RowData> {
	data: TData[];
	columns: WikiTableColumnDef<TData>[];
	tableId: string;
	initialState?: {
		sorting?: SortingState;
		columnFilters?: ColumnFiltersState;
		pagination?: PaginationState;
		globalFilter?: string;
	};
	initialSorting?: SortingState;
	rowComponent?: React.FC<{ row: Row<WikiTableFeatures, TData> }>;
	rowMinHeight?: string;
}

interface PaginationControlsProps<TData extends RowData> {
	table: ReactTable<WikiTableFeatures, TData>;
}

function PaginationControls<TData extends RowData>({ table }: PaginationControlsProps<TData>) {
	if (table.getRowCount() <= MIN_PAGE_SIZE) {
		return null;
	}

	return (
		<div className="overflow-x-auto max-w-full">
			<div className="flex items-center px-1 pt-2 gap-4 min-w-[720px] max-w-[1920px]">
				<div className="flex items-center gap-2">
					<span className="text-sm text-gray-700">1ページあたりの表示件数:</span>
					<Select
						value={table.state.pagination.pageSize}
						onChange={(e) => table.setPageSize(Number(e.target.value))}
						size="small"
						className="min-w-[80px]"
					>
						{PAGE_SIZE_OPTIONS.map((pageSize) => (
							<MenuItem key={pageSize} value={pageSize}>
								{pageSize}
							</MenuItem>
						))}
					</Select>
				</div>

				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1">
						<PaginationButton
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}
							icon={<FirstPage />}
						/>
						<PaginationButton
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
							icon={<NavigateBefore />}
						/>
						<span className="text-sm text-gray-700 mx-2">
							{table.state.pagination.pageIndex + 1} / {table.getPageCount()}
						</span>
						<PaginationButton
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
							icon={<NavigateNext />}
						/>
						<PaginationButton
							onClick={() => table.setPageIndex(table.getPageCount() - 1)}
							disabled={!table.getCanNextPage()}
							icon={<LastPage />}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

type AlignType = "left" | "center" | "right";

export interface ColumnMeta {
	align: AlignType;
	width?: string;
}

function isAlignType(value: unknown): value is AlignType {
	return value === "left" || value === "center" || value === "right";
}

export function getColumnMeta(meta: unknown): Partial<ColumnMeta> {
	if (typeof meta !== "object" || meta === null) return {};

	const align = "align" in meta && isAlignType(meta.align) ? meta.align : undefined;
	const width = "width" in meta && typeof meta.width === "string" ? meta.width : undefined;
	return { align, width };
}

function getFilterText(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function DefaultRowComponent<TData extends RowData>({
	row,
	minHeight,
}: {
	row: Row<WikiTableFeatures, TData>;
	minHeight?: string;
}) {
	return (
		<tr key={row.id} className="hover:bg-gray-50">
			{row.getVisibleCells().map((cell) => {
				const meta = getColumnMeta(cell.column.columnDef.meta);
				return (
					<td
						key={cell.id}
						className="p-2 border-b text-sm"
						style={{
							textAlign: meta?.align || "left",
							height: minHeight || "auto",
							verticalAlign: "middle",
						}}
					>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</td>
				);
			})}
		</tr>
	);
}

export function Table<TData extends RowData>({
	data,
	columns,
	tableId,
	initialState,
	initialSorting,
	rowComponent,
	rowMinHeight,
}: SortableTableProps<TData>) {
	const RowComponent = rowComponent ?? DefaultRowComponent;

	const storageKeyPrefix = `wiki-nanodesu.Table.${tableId}`;

	const getStoredState = <T,>(key: string, defaultValue: T): T => {
		if (typeof window === "undefined") return defaultValue;

		try {
			const storedValue = localStorage.getItem(`${storageKeyPrefix}.${key}`);
			return storedValue ? JSON.parse(storedValue) : defaultValue;
		} catch (e) {
			console.info(`Error retrieving state for ${key}:`, e);
			return defaultValue;
		}
	};

	const [sorting, setSorting] = useState<SortingState>(
		() => initialSorting ?? initialState?.sorting ?? [],
	);

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
		() => initialState?.columnFilters || [],
	);

	const [globalFilter, setGlobalFilter] = useState<string>(
		() => initialState?.globalFilter ?? "",
	);

	const [pagination, setPagination] = useState<PaginationState>(
		() =>
			initialState?.pagination ||
			getStoredState("pagination", { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE }),
	);

	const storeStateCallback = useCallback(
		<T,>(key: string, value: T) => {
			if (typeof window === "undefined") return;

			try {
				localStorage.setItem(`${storageKeyPrefix}.${key}`, JSON.stringify(value));
			} catch (e) {
				console.info(`Error storing state for ${key}:`, e);
			}
		},
		[storageKeyPrefix],
	);

	// ページネーション設定を保存するのです
	useEffect(() => {
		storeStateCallback("pagination", pagination);
	}, [pagination, storeStateCallback]);

	const globalFilterFn = useMemo(
		() =>
			createGlobalFilterFn<TData>((columnId) => {
				const columnDef = columns.find((col) => col.id === columnId);
				return typeof columnDef?.filterFn === "function" ? columnDef.filterFn : undefined;
			}),
		[columns],
	);

	const table = useTable({
		features,
		data,
		columns,
		state: {
			sorting,
			columnFilters,
			globalFilter,
			pagination,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: setPagination,
		enableSorting: true,
		enableFilters: true,
		enableColumnFilters: true,
		enableGlobalFilter: true,
		getColumnCanGlobalFilter: () => true,
		globalFilterFn,
		manualSorting: false,
		manualFiltering: false,
		defaultColumn: {
			minSize: 100,
			size: 150,
			maxSize: 400,
			filterFn: defaultCustomFilterFn,
		},
	});

	const globalFilterText = typeof globalFilter === "string" ? globalFilter : "";

	return (
		<div>
			<PaginationControls table={table} />

			{/* ページングとの間隔を抑えるのです */}
			<div className="flex items-center gap-2 pt-1 pb-2 max-w-[1920px]">
				<div className="relative ml-0.5 w-full max-w-md">
					<SearchIcon className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
					<input
						className="w-full p-1.5 pl-8 text-sm border-[0.175rem] border-gray-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
						type="text"
						aria-label="表全体を検索"
						value={globalFilterText}
						onChange={(e) => {
							table.setGlobalFilter(e.target.value);
						}}
						placeholder="表全体を検索..."
					/>
					{globalFilterText && (
						<button
							onClick={() => {
								table.resetGlobalFilter(true);
							}}
							className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
							aria-label="全体検索をクリア"
						>
							<CancelIcon />
						</button>
					)}
				</div>
			</div>

			<table className="border-collapse min-w-fit max-w-[1920px] [&_th]:border-[1px] [&_th]:border-gray-300 [&_td]:border-[1px] [&_td]:border-gray-300">
				<colgroup>
					{table.getHeaderGroups()[0].headers.map((header) => {
						const meta = getColumnMeta(header.column.columnDef.meta);
						return (
							<col
								key={header.id}
								className="table-column"
								style={{
									width: meta?.width,
								}}
							/>
						);
					})}
				</colgroup>
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<React.Fragment key={headerGroup.id}>
							<tr className="bg-gray-100">
								{headerGroup.headers.map((header) => {
									const meta = getColumnMeta(header.column.columnDef.meta);
									return (
										<th
											key={header.id}
											className="px-4 py-3 whitespace-nowrap"
											style={{
												textAlign: meta?.align || "left",
												cursor: header.column.getCanSort()
													? "pointer"
													: "default",
												width: meta?.width,
												minWidth: meta?.width,
											}}
											onClick={
												header.column.getCanSort()
													? (e) => {
															e.preventDefault();
															const currentSortDirection =
																header.column.getIsSorted();
															// 未ソート → 降順 → 昇順 → 未ソートの順番でトグル
															if (currentSortDirection === "asc") {
																setSorting([]);
															} else if (
																currentSortDirection === "desc"
															) {
																setSorting([
																	{ id: header.id, desc: false },
																]);
															} else {
																setSorting([
																	{ id: header.id, desc: true },
																]);
															}
														}
													: undefined
											}
										>
											<div className="flex items-center justify-between gap-2">
												<span className="font-semibold">
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
												</span>
												{header.column.getCanSort() && (
													<span className="inline-flex flex-col text-gray-700 h-3">
														<SortIndicatorArrow
															direction="up"
															active={
																header.column.getIsSorted() ===
																"asc"
															}
														/>
														<SortIndicatorArrow
															direction="down"
															active={
																header.column.getIsSorted() ===
																"desc"
															}
														/>
													</span>
												)}
											</div>
										</th>
									);
								})}
							</tr>
							<tr>
								{headerGroup.headers.map((header) => (
									<th key={header.id} className="bg-gray-50 p-2 py-2">
										{header.column.getCanFilter() && (
											<div className="relative">
												<input
													className="w-full p-1.5 text-sm border rounded-sm font-normal bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
													type="text"
													aria-label={`${header.column.id}列を検索`}
													value={getFilterText(
														header.column.getFilterValue(),
													)}
													onChange={(e) => {
														const newValue = e.target.value;
														header.column.setFilterValue(newValue);
													}}
													placeholder="検索..."
												/>
												{getFilterText(header.column.getFilterValue()) && (
													<button
														onClick={() => {
															header.column.setFilterValue("");
														}}
														className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
														aria-label="検索をクリア"
													>
														<CancelIcon />
													</button>
												)}
											</div>
										)}
									</th>
								))}
							</tr>
						</React.Fragment>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.map((row) => (
						<RowComponent key={row.id} row={row} minHeight={rowMinHeight} />
					))}
				</tbody>
			</table>

			<PaginationControls table={table} />
		</div>
	);
}

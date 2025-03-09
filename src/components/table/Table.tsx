"use client";

import React from "react";
import {
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	useReactTable,
	ColumnDef,
	OnChangeFn,
	PaginationState,
	SortingState,
	ColumnFiltersState,
	Row,
} from "@tanstack/react-table";
import CancelIcon from "@mui/icons-material/Cancel";
import { ColumnMeta } from "@/types/common";
import { Select, MenuItem, IconButton } from "@mui/material";
import {
	FirstPage,
	LastPage,
	NavigateNext,
	NavigateBefore,
} from "@mui/icons-material";

export interface SortableTableProps<TData, TValue> {
	data: TData[];
	columns: ColumnDef<TData, TValue>[];
	state: {
		sorting: SortingState;
		columnFilters: ColumnFiltersState;
		pagination: PaginationState;
	};
	onSortingChange: OnChangeFn<SortingState>;
	onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
	onPaginationChange: OnChangeFn<PaginationState>;
	rowComponent: React.FC<{ row: Row<TData> }>;
	pageSizes?: number[];
}

export function Table<TData, TValue>({
	data,
	columns,
	state,
	onSortingChange,
	onColumnFiltersChange,
	onPaginationChange,
	rowComponent: RowComponent,
	pageSizes = [500, 200, 100, 50, 20, 10],
}: SortableTableProps<TData, TValue>) {
	const table = useReactTable({
		data,
		columns,
		state,
		onSortingChange,
		onColumnFiltersChange,
		onPaginationChange,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		enableSorting: true,
		enableFilters: true,
		enableColumnFilters: true,
		manualSorting: false,
		manualFiltering: false,
		sortingFns: {
			stable: (rowA, rowB, columnId) => {
				const a = rowA.getValue(columnId) as number;
				const b = rowB.getValue(columnId) as number;
				const diff = a - b;
				return diff === 0
					? ("originalIndex" in rowA.original
							? (rowA.original as { originalIndex: number }).originalIndex
							: 0) -
							("originalIndex" in rowB.original
								? (rowB.original as { originalIndex: number }).originalIndex
								: 0)
					: diff;
			},
		},
		defaultColumn: {
			minSize: 100,
			size: 150,
			maxSize: 400,
		},
	});

	return (
		<div>
			<table className="border-collapse w-full [&_th]:border-[1px] [&_th]:border-gray-300 [&_td]:border-[1px] [&_td]:border-gray-300">
				<colgroup>
					{table.getHeaderGroups()[0].headers.map((header) => {
						const meta = header.column.columnDef.meta as ColumnMeta & {
							width?: string;
						};
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
									const meta = header.column.columnDef.meta as ColumnMeta & {
										width?: string;
									};
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
											onClick={header.column.getToggleSortingHandler()}
										>
											<div className="flex items-center justify-between gap-2">
												<span className="font-semibold">
													{flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
												</span>
												{/* ソートインジケーター */}
												{header.column.getCanSort() && (
													<span
														className="inline-flex flex-col text-gray-700"
														style={{ height: "15px" }}
													>
														{header.column.getIsSorted() === "asc" ? (
															<>
																<svg
																	className="text-blue-600"
																	style={{
																		width: "12px",
																		height: "12px",
																		marginBottom: "1px",
																	}}
																	viewBox="0 0 16 8"
																	fill="currentColor"
																>
																	<path d="M8 0L16 8H0z" />
																</svg>
																<svg
																	className="text-gray-300"
																	style={{ width: "12px", height: "12px" }}
																	viewBox="0 0 16 8"
																	fill="currentColor"
																>
																	<path d="M8 8L0 0h16z" />
																</svg>
															</>
														) : header.column.getIsSorted() === "desc" ? (
															<>
																<svg
																	className="text-gray-300"
																	style={{
																		width: "12px",
																		height: "12px",
																		marginBottom: "1px",
																	}}
																	viewBox="0 0 16 8"
																	fill="currentColor"
																>
																	<path d="M8 0L16 8H0z" />
																</svg>
																<svg
																	className="text-blue-600"
																	style={{ width: "12px", height: "12px" }}
																	viewBox="0 0 16 8"
																	fill="currentColor"
																>
																	<path d="M8 8L0 0h16z" />
																</svg>
															</>
														) : (
															<>
																<svg
																	className="text-gray-400"
																	style={{
																		width: "12px",
																		height: "12px",
																		marginBottom: "1px",
																	}}
																	viewBox="0 0 16 8"
																	fill="currentColor"
																>
																	<path d="M8 0L16 8H0z" />
																</svg>
																<svg
																	className="text-gray-400"
																	style={{ width: "12px", height: "12px" }}
																	viewBox="0 0 16 8"
																	fill="currentColor"
																>
																	<path d="M8 8L0 0h16z" />
																</svg>
															</>
														)}
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
													className="w-full p-2 text-sm border rounded-sm font-normal bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
													type="text"
													value={(header.column.getFilterValue() as string) ?? ""}
													onChange={(e) =>
														header.column.setFilterValue(e.target.value)
													}
													placeholder="検索..."
												/>
												{(header.column.getFilterValue() as
													| string
													| undefined) && (
													<button
														onClick={() => header.column.setFilterValue("")}
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
						<RowComponent key={row.id} row={row} />
					))}
				</tbody>
			</table>

			{/* ページネーションコンポーネント */}
			<div className="overflow-x-auto max-w-full">
				<div className="flex items-center px-1 py-2 gap-4 min-w-[720px] max-w-[1920px]">
					{/* ページサイズ指定 */}
					<div className="flex items-center gap-2">
						<span className="text-sm text-gray-700">
							1ページあたりの表示件数:
						</span>
						<Select
							value={table.getState().pagination.pageSize}
							onChange={(e) => table.setPageSize(Number(e.target.value))}
							size="small"
							className="min-w-[80px]"
						>
							{pageSizes.map((pageSize) => (
								<MenuItem key={pageSize} value={pageSize}>
									{pageSize}
								</MenuItem>
							))}
						</Select>
					</div>

					<div className="flex items-center gap-2">
						{/* ページ移動ボタン */}
						<div className="flex items-center gap-1">
							<IconButton
								size="small"
								onClick={() => table.setPageIndex(0)}
								disabled={!table.getCanPreviousPage()}
							>
								<FirstPage />
							</IconButton>
							<IconButton
								size="small"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								<NavigateBefore />
							</IconButton>
							<span className="text-sm text-gray-700 mx-2">
								{table.getState().pagination.pageIndex + 1} /{" "}
								{table.getPageCount()}
							</span>
							<IconButton
								size="small"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								<NavigateNext />
							</IconButton>
							<IconButton
								size="small"
								onClick={() => table.setPageIndex(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}
							>
								<LastPage />
							</IconButton>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

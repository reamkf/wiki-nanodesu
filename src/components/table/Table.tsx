"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	ColumnDef,
	ColumnFiltersState,
	PaginationState,
	Row,
	SortingState,
	Table as ReactTable,
	FilterFn,
	FilterFnOption,
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
import { QueryParser } from "@/utils/query-parser/queryParser";
import { includesNormalizeQuery } from "@/utils/queryNormalizer";

// ソート用の矢印SVGコンポーネント
interface SortIndicatorArrowProps {
	direction: 'up' | 'down';
	active: boolean;
}

function SortIndicatorArrow({ direction, active }: SortIndicatorArrowProps) {
	const isUp = direction === 'up';
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

// クエリパーサーを使用したカスタムフィルター関数
interface QueryParserFilterFnCache {
	evaluatorCache?: Map<string, (text: string) => boolean>;
}

const queryParserFilterFn: FilterFn<unknown> & QueryParserFilterFnCache = (row, columnId, filterValue) => {
	// 空のフィルター値の場合は全ての行を表示
	if (!filterValue || filterValue === '') return true;

	// 静的変数としてevaluatorをキャッシュ
	// filterValueごとに一度だけパースして再利用する
	const cacheKey = `${columnId}:${filterValue}`;
	if (!queryParserFilterFn.evaluatorCache) {
		queryParserFilterFn.evaluatorCache = new Map<string, (text: string) => boolean>();
	}

	// キャッシュからevaluatorを取得または新規作成
	let evaluator: (text: string) => boolean;
	if (queryParserFilterFn.evaluatorCache.has(cacheKey)) {
		evaluator = queryParserFilterFn.evaluatorCache.get(cacheKey)!;
	} else {
		try {
			// クエリパーサーを使用して検索条件を生成
			const parser = new QueryParser(filterValue);
			evaluator = parser.parse();
			queryParserFilterFn.evaluatorCache.set(cacheKey, evaluator);
		} catch {
			// パースエラーの場合は単純な文字列一致にフォールバック
			evaluator = (text: string) => includesNormalizeQuery(text, filterValue);
			queryParserFilterFn.evaluatorCache.set(cacheKey, evaluator);
		}
	}

	// 行の値を取得
	const cellValue = row.getValue(columnId);
	const textValue = cellValue != null ? String(cellValue) : '';

	// 検索条件に基づいて行をフィルタリング
	return evaluator(textValue);
};

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
		<IconButton
			size="small"
			onClick={onClick}
			disabled={disabled}
		>
			{icon}
		</IconButton>
	);
}

export interface SortableTableProps<TData, TValue> {
	data: TData[];
	columns: ColumnDef<TData, TValue>[];
	tableId: string;
	initialState?: {
		sorting?: SortingState;
		columnFilters?: ColumnFiltersState;
		pagination?: PaginationState;
	};
	rowComponent: React.FC<{ row: Row<TData> }>;
}

interface PaginationControlsProps<TData> { table: ReactTable<TData>; }

function PaginationControls<TData>({
	table,
}: PaginationControlsProps<TData>) {
	if (table.getRowCount() <= MIN_PAGE_SIZE) {
		return null;
	}

	return (
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
						{PAGE_SIZE_OPTIONS.map((pageSize) => (
							<MenuItem key={pageSize} value={pageSize}>
								{pageSize}
							</MenuItem>
						))}
					</Select>
				</div>

				<div className="flex items-center gap-2">
					{/* ページ移動ボタン */}
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
							{table.getState().pagination.pageIndex + 1} /{" "}
							{table.getPageCount()}
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

export function Table<TData, TValue>({
	data,
	columns,
	tableId,
	initialState,
	rowComponent: RowComponent,
}: SortableTableProps<TData, TValue>) {
	// localStorageのキー
	const storageKeyPrefix = `wiki-nanodesu.Table.${tableId}`;

	// localStorageから状態を取得するヘルパー関数
	const getStoredState = <T,>(key: string, defaultValue: T): T => {
		if (typeof window === 'undefined') return defaultValue;

		try {
			const storedValue = localStorage.getItem(`${storageKeyPrefix}.${key}`);
			return storedValue ? JSON.parse(storedValue) : defaultValue;
		} catch (e) {
			console.info(`Error retrieving state for ${key}:`, e);
			return defaultValue;
		}
	};

	// localStorageに状態を保存するヘルパー関数
	const storeState = <T,>(key: string, value: T) => {
		if (typeof window === 'undefined') return;

		try {
			localStorage.setItem(`${storageKeyPrefix}.${key}`, JSON.stringify(value));
		} catch (e) {
			console.info(`Error storing state for ${key}:`, e);
		}
	};

	// 状態管理
	const [sorting, setSorting] = useState<SortingState>(
		() => initialState?.sorting || []
	);

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
		() => initialState?.columnFilters || []
	);

	const [pagination, setPagination] = useState<PaginationState>(
		() => initialState?.pagination || getStoredState('pagination', { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE })
	);

	const storeStateCallback = useCallback(storeState, [storageKeyPrefix]);

	// ページネーション状態が変更されたときlocalStorageに保存
	useEffect(() => {
		storeStateCallback('pagination', pagination);
	}, [pagination, storeStateCallback]);

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnFilters,
			pagination,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		enableSorting: true,
		enableFilters: true,
		enableColumnFilters: true,
		manualSorting: false,
		manualFiltering: false,
		filterFns: {
			queryParser: queryParserFilterFn,
		},
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
			filterFn: 'queryParser' as FilterFnOption<TData>, // デフォルトのフィルター関数としてqueryParserを使用
		},
	});

	return (
		<div>
			{/* テーブル上部のページネーションコントロール */}
			<PaginationControls table={table} />

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
														className="inline-flex flex-col text-gray-700 h-3"
													>
														<SortIndicatorArrow
															direction="up"
															active={header.column.getIsSorted() === "asc"}
														/>
														<SortIndicatorArrow
															direction="down"
																active={header.column.getIsSorted() === "desc"}
														/>
													</span>
												)}
											</div>
										</th>
									);
								})}
							</tr>
							{/* 列ごとのフィルター用の行 */}
							<tr>
								{headerGroup.headers.map((header) => (
									<th key={header.id} className="bg-gray-50 p-2 py-2">
										{header.column.getCanFilter() && (
											<div className="relative">
												<input
													className="w-full p-2 text-sm border rounded-sm font-normal bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
													type="text"
													value={(header.column.getFilterValue() as string) ?? ""}
													onChange={(e) => {
														const newValue = e.target.value;
														header.column.setFilterValue(newValue);
													}}
													placeholder="検索..."
												/>
												{(header.column.getFilterValue() as string | undefined) && (
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
						<RowComponent key={row.id} row={row} />
					))}
				</tbody>
			</table>

			{/* テーブル下部のページネーションコントロール */}
			<PaginationControls table={table} />
		</div>
	);
}

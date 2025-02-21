'use client';

import { ProcessedFriendsStatusListItem } from "@/utils/friendsStatus";
import FriendsIcon from "../friends/FriendsIcon";
import { FriendsNameLink } from "../friends/FriendsNameLink";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
	getSortedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	SortingState,
	ColumnFiltersState,
	FilterFn,
	Row,
	Cell,
	PaginationState,
} from "@tanstack/react-table";
import { useMemo, useState, useEffect } from "react";
import React from "react";
import { FriendsAttributeIconAndName } from "./FriendsAttributeIconAndName";
import { FormGroup, FormControlLabel, Checkbox, Grid2, Select, MenuItem, IconButton } from '@mui/material';
import { FirstPage, LastPage, NavigateNext, NavigateBefore } from '@mui/icons-material';
import { normalizeQuery } from "@/utils/queryNormalizer";

// ステータスタイプの定義
const STATUS_TYPES = [
	'☆6/Lv200/野生4',
	'☆6/Lv200/野生5',
	'☆6/Lv99/野生4',
	'☆6/Lv99/野生5',
	'☆6/Lv90/野生4',
	'☆6/Lv90/野生5',
] as const;

interface FriendsStatusTableProps {
	friendsStatusList: ProcessedFriendsStatusListItem[];
}

type AlignType = "left" | "center" | "right";
interface ColumnMeta {
	align: AlignType;
	width?: string;
}

const getSearchableText = (row: ProcessedFriendsStatusListItem, columnId: string): string => {
	switch (columnId) {
		case "name": case 'icon':
			return row.friendsDataRow.secondName ? `${row.friendsDataRow.secondName} ${row.friendsDataRow.name}` : row.friendsDataRow.name;
		case "attribute":
			return row.friendsDataRow.attribute;
		default:
			return "";
	}
};

// カスタム検索関数
const customFilterFn: FilterFn<ProcessedFriendsStatusListItem> = (row, columnId, filterValue) => {
	const searchText = getSearchableText(row.original, columnId);
	return normalizeQuery(searchText).includes(normalizeQuery(filterValue));
};

// statusTypeに応じた背景色のマッピング
const statusTypeBackgroundColor: { [key: string]: {
	row: string;
	checkbox: {
		unchecked: string;
		checked: string;
		hover: string;
		color: string;
	};
}} = {
	'☆6/Lv90/野生4': {
		row: 'bg-green-100 hover:bg-green-50',
		checkbox: {
			unchecked: '#f0fdf4',
			checked: '#dcfce7',
			hover: '#bbf7d0',
			color: '#16a34a'
		}
	},
	'☆6/Lv99/野生4': {
		row: 'bg-blue-100 hover:bg-blue-50',
		checkbox: {
			unchecked: '#eff6ff',
			checked: '#dbeafe',
			hover: '#bfdbfe',
			color: '#2563eb'
		}
	},
	'☆6/Lv200/野生4': {
		row: 'bg-red-100 hover:bg-red-50',
		checkbox: {
			unchecked: '#fef2f2',
			checked: '#fee2e2',
			hover: '#fecaca',
			color: '#dc2626'
		}
	},
	'☆6/Lv90/野生5': {
		row: 'bg-green-100 hover:bg-green-50',
		checkbox: {
			unchecked: '#f0fdf4',
			checked: '#dcfce7',
			hover: '#bbf7d0',
			color: '#16a34a'
		}
	},
	'☆6/Lv99/野生5': {
		row: 'bg-blue-100 hover:bg-blue-50',
		checkbox: {
			unchecked: '#eff6ff',
			checked: '#dbeafe',
			hover: '#bfdbfe',
			color: '#2563eb'
		}
	},
	'☆6/Lv200/野生5': {
		row: 'bg-red-100 hover:bg-red-50',
		checkbox: {
			unchecked: '#fef2f2',
			checked: '#fee2e2',
			hover: '#fecaca',
			color: '#dc2626'
		}
	},
};

const renderYaseiLevel = (statusType: string) => {
	const [, lv, yasei] = statusType.split('/');
	const isYasei5 = statusType.includes('野生5');

	return (
		<>
			{lv}/{
				isYasei5 ?
					<span className="font-bold bg-yellow-200 text-red-600 px-1 rounded">{yasei}</span>
					: `${yasei}`
			}
		</>
	);
};

// メモ化された行コンポーネント
const TableRow = React.memo(function TableRow({ row }: { row: Row<ProcessedFriendsStatusListItem> }) {
	const statusType = row.original.statusType;
	const bgColorClass = statusTypeBackgroundColor[statusType]?.row || 'hover:bg-gray-50';

	return (
		<tr className={bgColorClass}>
			{row.getVisibleCells().map((cell: Cell<ProcessedFriendsStatusListItem, unknown>) => (
				<td
					key={cell.id}
					className="border-[1px] border-gray-300 px-4 py-2"
					style={{
						textAlign: (cell.column.columnDef.meta as ColumnMeta)?.align || "left",
					}}
				>
					{flexRender(cell.column.columnDef.cell, cell.getContext())}
				</td>
			))}
		</tr>
	);
});

export default function FriendsStatusTable({ friendsStatusList }: FriendsStatusTableProps) {
	const [isMounted, setIsMounted] = useState(false);
	const [selectedStatusTypes, setSelectedStatusTypes] = useState<Set<string>>(new Set(STATUS_TYPES));
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 20,
	});

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const filteredData = useMemo(() => {
		return friendsStatusList.filter(item => selectedStatusTypes.has(item.statusType));
	}, [friendsStatusList, selectedStatusTypes]);

	const handleStatusTypeChange = (statusType: string) => {
		setSelectedStatusTypes(prev => {
			const newSet = new Set(prev);
			if (newSet.has(statusType)) {
				newSet.delete(statusType);
			} else {
				newSet.add(statusType);
			}
			return newSet;
		});
	};

	const columnHelper = createColumnHelper<ProcessedFriendsStatusListItem>();

	const columns = useMemo(() => [
		columnHelper.accessor((row) => row, {
			id: "icon",
			header: "アイコン",
			cell: (info) => (
				<div className="flex justify-center">
					<FriendsIcon friendsData={info.getValue().friendsDataRow} size={55} />
				</div>
			),
			enableSorting: false,
			filterFn: customFilterFn,
			meta: {
				align: "center" as const,
				width: "100px",
			},
		}),
		columnHelper.accessor((row) => row.sortValues.name, {
			id: "name",
			header: "フレンズ名",
			cell: (info) => {
				const statusType = info.row.original.statusType;
				const isYasei5 = statusType.includes('野生5');
				const [baseText, yasei] = statusType.split('/野生');
				return (
					<div>
						<FriendsNameLink friend={info.row.original.friendsDataRow} />
						<div className="text-xs text-gray-700">
							{baseText}/
							{isYasei5 ? (
								<span className="font-bold bg-yellow-200 text-red-600 px-1 rounded">野生{yasei}</span>
							) : (
								`野生${yasei}`
							)}
						</div>
					</div>
				);
			},
			filterFn: customFilterFn,
			meta: {
				align: "left" as const,
				width: "250px",
			},
		}),
		columnHelper.accessor((row) => row.sortValues.attribute, {
			id: "attribute",
			header: "属性",
			cell: (info) => <FriendsAttributeIconAndName attribute={info.getValue()} />,
			filterFn: customFilterFn,
			meta: {
				align: "center" as const,
				width: "100px",
			},
		}),
		columnHelper.accessor((row) => row.sortValues.kemosute, {
			id: "kemosute",
			header: "けもステ",
			cell: (info) => info.row.original.displayValues.kemosute,
			meta: {
				align: "right" as const,
				width: "100px",
			},
		}),
		columnHelper.accessor((row) => row.sortValues.hp, {
			id: "hp",
			header: "たいりょく",
			cell: (info) => info.row.original.displayValues.hp,
			meta: {
				align: "right" as const,
				width: "100px",
			},
		}),
		columnHelper.accessor((row) => row.sortValues.atk, {
			id: "atk",
			header: "こうげき",
			cell: (info) => info.row.original.displayValues.atk,
			meta: {
				align: "right" as const,
				width: "100px",
			},
		}),
		columnHelper.accessor((row) => row.sortValues.def, {
			id: "def",
			header: "まもり",
			cell: (info) => info.row.original.displayValues.def,
			meta: {
				align: "right" as const,
				width: "100px",
			},
		}),
	], [columnHelper]);

	const table = useReactTable({
		data: filteredData,
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
		sortingFns: {
			stable: (rowA, rowB, columnId) => {
				const a = rowA.getValue(columnId) as number;
				const b = rowB.getValue(columnId) as number;
				const diff = a - b;
				return diff === 0 ? rowA.original.originalIndex - rowB.original.originalIndex : diff;
			},
		},
		defaultColumn: {
			minSize: 100,
			size: 150,
			maxSize: 400,
		},
	});

	if (friendsStatusList.length === 0) return null;
	if (!isMounted) return null;

	return (
		<div className="space-y-4">
			<FormGroup>
				<Grid2 container spacing={2}>
					{STATUS_TYPES.map((statusType) => (
						<Grid2 key={statusType}>
							<FormControlLabel
								sx={{
									backgroundColor: selectedStatusTypes.has(statusType)
										? statusTypeBackgroundColor[statusType].checkbox.checked
										: statusTypeBackgroundColor[statusType].checkbox.unchecked,
									'&:hover': {
										backgroundColor: statusTypeBackgroundColor[statusType].checkbox.hover,
									},
									borderRadius: 2,
									width: 'fit-content',
									margin: 0,
									'& .MuiFormControlLabel-label': {
										flex: 1,
									},
								}}
								control={
									<Checkbox
										checked={selectedStatusTypes.has(statusType)}
										onChange={() => handleStatusTypeChange(statusType)}
										sx={{
											'&.Mui-checked': {
												color: statusTypeBackgroundColor[statusType].checkbox.color,
											},
											padding: '0.25rem',
											paddingRight: 0,
										}}
									/>
								}
								label={<div className="text-base p-1">{renderYaseiLevel(statusType)}</div>}
							/>
						</Grid2>
					))}
				</Grid2>
			</FormGroup>
			<div className="overflow-x-auto max-w-full">
				<table className="min-w-[720px] max-w-[1920px] border-collapse w-full [&_th]:border-[1px] [&_th]:border-gray-300 [&_td]:border-[1px] [&_td]:border-gray-300">
					<colgroup>
						{table.getHeaderGroups()[0].headers.map((header) => {
							const meta = header.column.columnDef.meta as ColumnMeta & { width?: string };
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
										const meta = header.column.columnDef.meta as ColumnMeta & { width?: string };
										return (
											<th
												key={header.id}
												className="px-4 py-3 whitespace-nowrap"
												style={{
													textAlign: meta?.align || "left",
													cursor: header.column.getCanSort() ? "pointer" : "default",
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
													{header.column.getCanSort() && (
														<span className="inline-flex flex-col text-gray-700" style={{ height: '15px' }}>
															{header.column.getIsSorted() === "asc" ? (
																<>
																	<svg className="text-blue-600" style={{ width: '12px', height: '12px', marginBottom: '1px' }} viewBox="0 0 16 8" fill="currentColor">
																		<path d="M8 0L16 8H0z" />
																	</svg>
																	<svg className="text-gray-300" style={{ width: '12px', height: '12px' }} viewBox="0 0 16 8" fill="currentColor">
																		<path d="M8 8L0 0h16z" />
																	</svg>
																</>
															) : header.column.getIsSorted() === "desc" ? (
																<>
																	<svg className="text-gray-300" style={{ width: '12px', height: '12px', marginBottom: '1px' }} viewBox="0 0 16 8" fill="currentColor">
																		<path d="M8 0L16 8H0z" />
																	</svg>
																	<svg className="text-blue-600" style={{ width: '12px', height: '12px' }} viewBox="0 0 16 8" fill="currentColor">
																		<path d="M8 8L0 0h16z" />
																	</svg>
																</>
															) : (
																<>
																	<svg className="text-gray-400" style={{ width: '12px', height: '12px', marginBottom: '1px' }} viewBox="0 0 16 8" fill="currentColor">
																		<path d="M8 0L16 8H0z" />
																	</svg>
																	<svg className="text-gray-400" style={{ width: '12px', height: '12px' }} viewBox="0 0 16 8" fill="currentColor">
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
										<th key={header.id} className="bg-gray-50 p-1">
											{header.column.getCanFilter() && (
												<input
													className="w-full p-2 text-sm border rounded font-normal bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
													type="text"
													value={(header.column.getFilterValue() as string) ?? ""}
													onChange={(e) => header.column.setFilterValue(e.target.value)}
													placeholder="検索..."
												/>
											)}
										</th>
									))}
								</tr>
							</React.Fragment>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map((row) => (
							<TableRow key={row.id} row={row} />
						))}
					</tbody>
				</table>
			</div>
			<div className="flex items-center justify-between px-4 py-2">
				<div className="flex items-center gap-2">
					<span className="text-sm text-gray-700">1ページあたりの表示件数:</span>
					<Select
						value={table.getState().pagination.pageSize}
						onChange={(e) => table.setPageSize(Number(e.target.value))}
						size="small"
						sx={{ minWidth: 80 }}
					>
						{[500, 200, 100, 50, 20, 10].map((pageSize) => (
							<MenuItem key={pageSize} value={pageSize}>
								{pageSize}
							</MenuItem>
						))}
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1 text-sm text-gray-700">
						<span>{table.getFilteredRowModel().rows.length}件中</span>
						<span>{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-</span>
						<span>
							{Math.min(
								(table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
								table.getFilteredRowModel().rows.length
							)}
						</span>
						<span>件を表示中</span>
					</div>
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
							{table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
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
	);
}

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
	SortingState,
	ColumnFiltersState,
	FilterFn,
	Row,
	Cell,
} from "@tanstack/react-table";
import { useMemo, useState, useEffect } from "react";
import React from "react";
import { FriendsAttributeIconAndName } from "./FriendsAttributeIconAndName";

interface DataTableProps {
	friendsStatusList: ProcessedFriendsStatusListItem[];
}

type AlignType = "left" | "center" | "right";
interface ColumnMeta {
	align: AlignType;
	width?: string;
}

const getSearchableText = (row: ProcessedFriendsStatusListItem, columnId: string): string => {
	switch (columnId) {
		case "name":
			return row.friendsDataRow.name;
		case "icon":
			return row.friendsDataRow.name;
		default:
			return "";
	}
};

// カスタム検索関数
const customFilterFn: FilterFn<ProcessedFriendsStatusListItem> = (row, columnId, filterValue) => {
	const searchText = getSearchableText(row.original, columnId);
	return searchText.toLowerCase().includes(filterValue.toLowerCase());
};

// statusTypeに応じた背景色のマッピング
const statusTypeBackgroundColor: { [key: string]: string } = {
	'☆6/Lv90/野生4': 'hover:bg-gray-50',
	'☆6/Lv99/野生4': 'bg-blue-100 hover:bg-blue-50',
	'☆6/Lv100/野生4': 'bg-red-100 hover:bg-red-50',
	'☆6/Lv200/野生4': 'bg-red-100 hover:bg-red-50',
	'☆6/Lv90/野生5': 'hover:bg-gray-50',
	'☆6/Lv99/野生5': 'bg-blue-100 hover:bg-blue-50',
	'☆6/Lv100/野生5': 'bg-red-100 hover:bg-red-50',
	'☆6/Lv200/野生5': 'bg-red-100 hover:bg-red-50',
};

// メモ化された行コンポーネント
const TableRow = React.memo(function TableRow({ row }: { row: Row<ProcessedFriendsStatusListItem> }) {
	const statusType = row.original.statusType;
	const bgColorClass = statusTypeBackgroundColor[statusType] || 'hover:bg-gray-50';

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

export default function FriendsStatusTable({ friendsStatusList }: DataTableProps) {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const [sorting, setSorting] = useState<SortingState>([
		{
			id: "kemosute",
			desc: true
		}
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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
		data: friendsStatusList,
		columns,
		state: {
			sorting,
			columnFilters,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		sortingFns: {
			stable: (rowA, rowB, columnId) => {
				const a = rowA.getValue(columnId) as number;
				const b = rowB.getValue(columnId) as number;
				const diff = a - b;
				return diff === 0 ? rowA.original.originalIndex - rowB.original.originalIndex : diff;
			},
		},
	});

	if (friendsStatusList.length === 0) return null;
	if (!isMounted) return null;

	return (
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
							<tr className="bg-gray-200">
								{headerGroup.headers.map((header) => {
									const meta = header.column.columnDef.meta as ColumnMeta & { width?: string };
									return (
										<th
											key={header.id}
											className="px-4 py-2 whitespace-nowrap"
											style={{
												textAlign: meta?.align || "left",
												cursor: header.column.getCanSort() ? "pointer" : "default",
												width: meta?.width,
												minWidth: meta?.width,
											}}
											onClick={header.column.getToggleSortingHandler()}
										>
											<div className="flex items-center justify-between gap-2">
												<span>
													{flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
												</span>
												{header.column.getCanSort() && (
													<span className="inline-flex flex-col text-gray-700" style={{ height: '15px' }}>
														{header.column.getIsSorted() === "asc" ? (
															<>
																<svg className="text-blue-600" style={{ width: '10px', height: '10px', marginBottom: '1px' }} viewBox="0 0 16 8" fill="currentColor">
																	<path d="M8 0L16 8H0z" />
																</svg>
																<svg className="text-gray-300" style={{ width: '10px', height: '10px' }} viewBox="0 0 16 8" fill="currentColor">
																	<path d="M8 8L0 0h16z" />
																</svg>
															</>
														) : header.column.getIsSorted() === "desc" ? (
															<>
																<svg className="text-gray-300" style={{ width: '10px', height: '10px', marginBottom: '1px' }} viewBox="0 0 16 8" fill="currentColor">
																	<path d="M8 0L16 8H0z" />
																</svg>
																<svg className="text-blue-600" style={{ width: '10px', height: '10px' }} viewBox="0 0 16 8" fill="currentColor">
																	<path d="M8 8L0 0h16z" />
																</svg>
															</>
														) : (
															<>
																<svg style={{ width: '10px', height: '10px', marginBottom: '1px' }} viewBox="0 0 16 8" fill="currentColor">
																	<path d="M8 0L16 8H0z" />
																</svg>
																<svg style={{ width: '10px', height: '10px' }} viewBox="0 0 16 8" fill="currentColor">
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
							{/* 列ごとの検索欄 */}
							<tr>
								{headerGroup.headers.map((header) => (
									<th key={header.id} className="bg-gray-100 p-1">
										{header.column.getCanFilter() && (
											<input
												className="w-full p-1 text-sm border rounded font-normal"
												type="text"
												value={
													(header.column.getFilterValue() as string) ?? ""
												}
												onChange={(e) =>
													header.column.setFilterValue(e.target.value)
												}
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
	);
}

'use client';

import { FriendsStatusListItem } from "@/types/friends";
import FriendsIcon from "../friends/FriendsIcon";
import { FriendsNameLink } from "../friends/FriendsNameLink";
import { calcKemosute } from "@/utils/common";
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
	friendsStatusList: FriendsStatusListItem[];
}

type AlignType = "left" | "center" | "right";
interface ColumnMeta {
	align: AlignType;
	width?: string;
}

const getSearchableText = (row: FriendsStatusListItem, columnId: string): string => {
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
const customFilterFn: FilterFn<FriendsStatusListItem> = (row, columnId, filterValue) => {
	const searchText = getSearchableText(row.original, columnId);
	return searchText.toLowerCase().includes(filterValue.toLowerCase());
};

// メモ化された行コンポーネント
const TableRow = React.memo(function TableRow({ row }: { row: Row<FriendsStatusListItem> }) {
	return (
		<tr className="hover:bg-gray-50">
			{row.getVisibleCells().map((cell: Cell<FriendsStatusListItem, unknown>) => (
				<td
					key={cell.id}
					className="border px-4 py-2"
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

	const columnHelper = createColumnHelper<FriendsStatusListItem>();

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
		columnHelper.accessor((row) => row, {
			id: "name",
			header: "フレンズ名",
			cell: (info) => (
				<div>
					<FriendsNameLink friend={info.getValue().friendsDataRow} />
					<div className="text-xs text-gray-500">{info.getValue().statusType}</div>
				</div>
			),
			filterFn: customFilterFn,
			sortingFn: (rowA, rowB) => {
				return rowA.original.friendsDataRow.name.localeCompare(rowB.original.friendsDataRow.name);
			},
			meta: {
				align: "left" as const,
				width: "250px",
			},
		}),
		columnHelper.accessor((row) => row, {
			id: "attribute",
			header: "属性",
			cell: (info) => <FriendsAttributeIconAndName attribute={info.getValue().friendsDataRow.attribute} />,
			meta: {
				align: "center" as const,
				width: "100px",
			},
		}),
		columnHelper.accessor((row) => calcKemosute(row.status), {
			id: "kemosute",
			header: "けもステ",
			cell: (info) => {
				const value = info.getValue();
				return value === null ? "?????" : Math.round(value).toLocaleString();
			},
			sortingFn: (rowA, rowB) => {
				const a = rowA.getValue("kemosute") as number | null;
				const b = rowB.getValue("kemosute") as number | null;
				if (a === null) return -1;
				if (b === null) return 1;
				return (a ?? 0) - (b ?? 0);
			},
			meta: {
				align: "right" as const,
				width: "100px",
			},
		}),
		columnHelper.accessor((row) => row.status.hp, {
			id: "hp",
			header: "たいりょく",
			cell: (info) => info.getValue() === null ? "?????" : info.getValue()?.toLocaleString(),
			sortingFn: (rowA, rowB) => {
				const a = rowA.getValue("hp") as number | null;
				const b = rowB.getValue("hp") as number | null;
				if (a === null) return -1;
				if (b === null) return 1;
				return (a ?? 0) - (b ?? 0);
			},
			meta: {
				align: "right" as const,
				width: "100px",
			},
		}),
		columnHelper.accessor((row) => row.status.atk, {
			id: "atk",
			header: "こうげき",
			cell: (info) => info.getValue() === null ? "?????" : info.getValue()?.toLocaleString(),
			sortingFn: (rowA, rowB) => {
				const a = rowA.getValue("atk") as number | null;
				const b = rowB.getValue("atk") as number | null;
				if (a === null) return -1;
				if (b === null) return 1;
				return (a ?? 0) - (b ?? 0);
			},
			meta: {
				align: "right" as const,
				width: "100px",
			},
		}),
		columnHelper.accessor((row) => row.status.def, {
			id: "def",
			header: "まもり",
			cell: (info) => info.getValue() === null ? "?????" : info.getValue()?.toLocaleString(),
			sortingFn: (rowA, rowB) => {
				const a = rowA.getValue("def") as number | null;
				const b = rowB.getValue("def") as number | null;
				if (a === null) return -1;
				if (b === null) return 1;
				return (a ?? 0) - (b ?? 0);
			},
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
	});

	if (friendsStatusList.length === 0) return null;
	if (!isMounted) return null;

	return (
		<div className="overflow-x-auto max-w-full">
			<table className="min-w-[720px] max-w-[1920px] border-collapse w-full">
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
											className="border px-4 py-2 whitespace-nowrap"
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
									<th key={header.id} className="border bg-gray-100 px-4 py-2">
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

'use client';

import { FriendsDataRow } from "@/types/friends";
import FriendsIcon from "..//friends/FriendsIcon";
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
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import React from "react";
import { FriendsAttributeIconAndName } from "./FriendsAttributeIconAndName";
interface DataTableProps {
	friendsData: FriendsDataRow[];
}

type AlignType = "left" | "center" | "right";
interface ColumnMeta {
	align: AlignType;
	width?: string;
}

// 検索対象のテキストを取得する関数
const getSearchableText = (row: FriendsDataRow, columnId: string): string => {
	switch (columnId) {
		case "name":
			return row.name;
		case "icon":
			return row.name; // アイコンカラムもフレンズ名で検索可能
		default:
			return "";
	}
};

// カスタム検索関数
const customFilterFn: FilterFn<FriendsDataRow> = (row, columnId, filterValue) => {
	const searchText = getSearchableText(row.original, columnId);
	return searchText.toLowerCase().includes(filterValue.toLowerCase());
};

export default function FriendsStatusTable({ friendsData }: DataTableProps) {
	const [sorting, setSorting] = useState<SortingState>([
		{
			id: "kemosute",
			desc: true
		}
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const columnHelper = createColumnHelper<FriendsDataRow>();

	const columns = useMemo(() => [
		columnHelper.accessor("listIndex", {
			header: "一覧順",
			cell: (info) => info.getValue(),
			meta: {
				align: "center" as const,
				width: "50px",
			},
		}),
		columnHelper.accessor((row) => row, {
			id: "icon",
			header: "アイコン",
			cell: (info) => (
				<div className="flex justify-center">
					<FriendsIcon friendsData={info.getValue()} size={55} />
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
			cell: (info) => <FriendsNameLink friend={info.getValue()} />,
			filterFn: customFilterFn,
			sortingFn: (rowA, rowB) => {
				return rowA.original.name.localeCompare(rowB.original.name);
			},
			meta: {
				align: "left" as const,
				width: "250px",
			},
		}),
		columnHelper.accessor("attribute", {
			header: "属性",
			cell: (info) => <FriendsAttributeIconAndName attribute={info.getValue()} />,
			meta: {
				align: "center" as const,
				width: "100px",
			},
		}),
		columnHelper.accessor((row) => calcKemosute(row.status.statusInitial), {
			id: "kemosute",
			header: "けもステ",
			cell: (info) => `${Math.round(info.getValue() ?? 0).toLocaleString()}`,
			meta: {
				align: "right" as const,
				width: "100px",
			},
		}),
		columnHelper.accessor("status.statusInitial.hp", {
			header: "たいりょく",
			cell: (info) => info.getValue()?.toLocaleString(),
			meta: {
				align: "right" as const,
				width: "100px",
			},
		}),
		columnHelper.accessor("status.statusInitial.atk", {
			header: "こうげき",
			cell: (info) => info.getValue()?.toLocaleString(),
			meta: {
				align: "right" as const,
				width: "100px",
			},
		}),
		columnHelper.accessor("status.statusInitial.def", {
			header: "まもり",
			cell: (info) => info.getValue()?.toLocaleString(),
			meta: {
				align: "right" as const,
				width: "100px",
			},
		}),
		columnHelper.accessor("status.avoid", {
			header: "かいひ",
			cell: (info) => `${(info.getValue() ?? 0 * 100).toFixed(1)}%`,
			meta: {
				align: "right" as const,
				width: "100px",
			},
		}),
	], [columnHelper]);

	const table = useReactTable({
		data: friendsData,
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

	if (friendsData.length === 0) return null;

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
						<tr key={row.id} className="hover:bg-gray-50">
							{row.getVisibleCells().map((cell) => (
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
					))}
				</tbody>
			</table>
		</div>
	);
}

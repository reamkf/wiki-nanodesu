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
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const columnHelper = createColumnHelper<FriendsDataRow>();

	const columns = useMemo(() => [
		columnHelper.accessor("list_index", {
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
			meta: {
				align: "left" as const,
				width: "300px",
			},
		}),
		columnHelper.accessor("attribute", {
			header: "属性",
			cell: (info) => info.getValue(),
			meta: {
				align: "center" as const,
				width: "100px",
			},
		}),
		columnHelper.accessor((row) => calcKemosute(row.status.statusInitial), {
			id: "kemosute",
			header: "けもステ",
			cell: (info) => `${Math.round(info.getValue()).toLocaleString()}`,
			meta: {
				align: "right" as const,
				width: "120px",
			},
		}),
		columnHelper.accessor("status.statusInitial.hp", {
			header: "たいりょく",
			cell: (info) => info.getValue().toLocaleString(),
			meta: {
				align: "right" as const,
				width: "120px",
			},
		}),
		columnHelper.accessor("status.statusInitial.atk", {
			header: "こうげき",
			cell: (info) => info.getValue().toLocaleString(),
			meta: {
				align: "right" as const,
				width: "120px",
			},
		}),
		columnHelper.accessor("status.statusInitial.def", {
			header: "まもり",
			cell: (info) => info.getValue().toLocaleString(),
			meta: {
				align: "right" as const,
				width: "120px",
			},
		}),
		columnHelper.accessor("status.avoid", {
			header: "かいひ",
			cell: (info) => `${info.getValue().toFixed(1)}%`,
			meta: {
				align: "right" as const,
				width: "120px",
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
			<table className="min-w-full w-max border-collapse">
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id} className="bg-gray-100">
							{headerGroup.headers.map((header) => {
								const meta = header.column.columnDef.meta as ColumnMeta & { width?: string };
								return (
									<th
										key={header.id}
										className="border px-4 py-2"
										style={{
											textAlign: meta?.align || "left",
											cursor: header.column.getCanSort() ? "pointer" : "default",
											width: meta?.width,
										}}
										onClick={header.column.getToggleSortingHandler()}
									>
										{flexRender(
											header.column.columnDef.header,
											header.getContext()
										)}
										{header.column.getCanSort() && (
											<span className="ml-2">
												{{
													asc: "🔼",
													desc: "🔽",
												}[header.column.getIsSorted() as string] ?? ""}
											</span>
										)}
										{header.column.getCanFilter() && (
											<div>
												<input
													type="text"
													value={
														(header.column.getFilterValue() as string) ?? ""
													}
													onChange={(e) =>
														header.column.setFilterValue(e.target.value)
													}
													placeholder="検索..."
													className="w-full p-1 text-sm border rounded"
												/>
											</div>
										)}
									</th>
								);
							})}
						</tr>
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

"use client";

import React, { useCallback } from "react";
import { Table } from "@/components/table/Table";
import {
	ColumnDef,
	Row,
	flexRender,
} from "@tanstack/react-table";
import { includesNormalizeQuery } from "@/utils/queryNormalizer";

// 汎用的なフィルタリング可能なデータテーブルコンポーネント
export const FilterableDataTable = React.memo(({
	data,
	columns,
	tableId,
}: {
	data: Record<string, unknown>[];
	columns: ColumnDef<Record<string, unknown>, unknown>[];
	tableId: string;
}) => {
	// カスタム行コンポーネント
	const CustomRowComponent = useCallback(({ row }: { row: Row<Record<string, unknown>> }) => (
		<tr
			key={row.id}
			className="hover:bg-gray-50"
		>
			{row.getVisibleCells().map(cell => {
				return (
					<td
						key={cell.id}
						className={`p-2 border-b text-sm`}
					>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</td>
				);
			})}
		</tr>
	), []);

	return (
		<>
			<Table
				data={data}
				columns={columns}
				tableId={tableId}
				rowComponent={CustomRowComponent}
			/>
		</>
	);
});

// カスタムフィルター関数
export const createCustomFilterFn = <T extends Record<string, unknown>>(
	getSearchableText: (row: T, columnId: string) => string
) => {
	return (row: Row<T>, columnId: string, filterValue: string) => {
		const value = getSearchableText(row.original, columnId);
		return includesNormalizeQuery(value, filterValue);
	};
};

FilterableDataTable.displayName = "FilterableDataTable";
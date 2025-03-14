"use client";

import React, { useCallback } from "react";
import { Table } from "@/components/table/Table";
import {
	ColumnDef,
	Row,
	flexRender,
} from "@tanstack/react-table";

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

FilterableDataTable.displayName = "FilterableDataTable";
"use client";

import React, { useCallback } from "react";
import { Table } from "@/components/table/Table";
import {
	ColumnDef,
	Row,
	flexRender,
	FilterFn,
} from "@tanstack/react-table";
import { includesNormalizeQuery } from "@/utils/queryNormalizer";
import { QueryParser } from "@/utils/query-parser/queryParser";

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

// クエリパーサーのキャッシュ用インターフェース
interface QueryParserCache {
	evaluatorCache: Map<string, (text: string) => boolean>;
}

// クエリパーサーのキャッシュ
const queryParserCache: QueryParserCache = {
	evaluatorCache: new Map<string, (text: string) => boolean>()
};

// カスタムフィルター関数
export const createCustomFilterFn = <T extends Record<string, unknown>>(
	getSearchableText: (row: T, columnId: string) => string
): FilterFn<T> => {
	return (row: Row<T>, columnId: string, filterValue: string) => {
		// 空のフィルター値の場合は全ての行を表示
		if (!filterValue || filterValue === '') return true;

		// 行の値を取得
		const value = getSearchableText(row.original, columnId);

		// 静的変数としてevaluatorをキャッシュ
		// filterValueごとに一度だけパースして再利用する
		const cacheKey = `custom:${columnId}:${filterValue}`;

		// キャッシュからevaluatorを取得または新規作成
		let evaluator: (text: string) => boolean;
		if (queryParserCache.evaluatorCache.has(cacheKey)) {
			evaluator = queryParserCache.evaluatorCache.get(cacheKey)!;
		} else {
			try {
				// クエリパーサーを使用して検索条件を生成
				const parser = new QueryParser(filterValue);
				evaluator = parser.parse();
				queryParserCache.evaluatorCache.set(cacheKey, evaluator);
			} catch {
				// パースエラーの場合は単純な文字列一致にフォールバック
				evaluator = (text: string) => includesNormalizeQuery(text, filterValue);
				queryParserCache.evaluatorCache.set(cacheKey, evaluator);
			}
		}

		// 検索条件に基づいて行をフィルタリング
		return evaluator(value);
	};
};

FilterableDataTable.displayName = "FilterableDataTable";
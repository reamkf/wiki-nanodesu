import { FilterFn, Row, RowData } from "@tanstack/react-table";
import { normalizeQuery } from "@/utils/queryNormalizer";
import { QueryParser } from "@/utils/queryParser";

type CustomFilterFnRowType = RowData;

interface QueryParserCache {
	evaluatorCache: Map<string, (text: string) => boolean>;
}

const queryParserCache: QueryParserCache = {
	evaluatorCache: new Map<string, (text: string) => boolean>(),
};

export const createCustomFilterFn = <T extends CustomFilterFnRowType>(
	getSearchableText: (row: T, columnId: string) => string,
): FilterFn<any, T> => {
	return (row: Row<any, T>, columnId: string, filterValue: string) => {
		// 空の値は全行を通すのです
		if (!filterValue || filterValue === "") return true;
		const normalizedFilterValue = normalizeQuery(filterValue);

		const value = getSearchableText(row.original, columnId);
		const normalizedValue = normalizeQuery(value);

		// 条件式のパース結果を再利用するのです
		const cacheKey = `custom:${columnId}:${normalizedFilterValue}`;

		let evaluator: (text: string) => boolean;
		if (queryParserCache.evaluatorCache.has(cacheKey)) {
			evaluator = queryParserCache.evaluatorCache.get(cacheKey)!;
		} else {
			try {
				const parser = new QueryParser(normalizedFilterValue);
				evaluator = parser.parse();
				queryParserCache.evaluatorCache.set(cacheKey, evaluator);
			} catch {
				// パースに失敗したら文字列一致にフォールバックするのです
				evaluator = (text: string) => text.includes(normalizedFilterValue);
				queryParserCache.evaluatorCache.set(cacheKey, evaluator);
			}
		}

		return evaluator(normalizedValue);
	};
};

export const defaultCustomFilterFn = createCustomFilterFn<any>((row, columnId) => {
	const value = row[columnId];
	return value != null ? String(value) : "";
});

// 全体検索は列ごとのfilterFnへ委譲するのです
export const createGlobalFilterFn = <T extends CustomFilterFnRowType>(
	getColumnFilterFn: (columnId: string) => FilterFn<any, T> | undefined,
	fallbackFilterFn?: FilterFn<any, T>,
): FilterFn<any, T> => {
	const fallback = fallbackFilterFn ?? (defaultCustomFilterFn as unknown as FilterFn<any, T>);
	return (row: Row<any, T>, columnId: string, filterValue: string, addMeta) => {
		// 空の値は全行を通すのです
		if (!filterValue || filterValue === "") return true;
		const columnFilterFn = getColumnFilterFn(columnId) ?? fallback;
		return columnFilterFn(row, columnId, filterValue, addMeta);
	};
};

import { FilterFn, Row } from "@tanstack/react-table";
import { normalizeQuery } from "@/utils/queryNormalizer";
import { QueryParser } from "@/utils/query-parser/queryParser";

// CustomFilterFnRow型を修正 - インデックスシグネチャを必須としない
type CustomFilterFnRow = object;

// クエリパーサーのキャッシュ用インターフェース
interface QueryParserCache {
	evaluatorCache: Map<string, (text: string) => boolean>;
}

// クエリパーサーのキャッシュ
export const queryParserCache: QueryParserCache = {
	evaluatorCache: new Map<string, (text: string) => boolean>()
};

// カスタムフィルター関数
export const createCustomFilterFn = <T extends CustomFilterFnRow>(
	getSearchableText: (row: T, columnId: string) => string
): FilterFn<T> => {
	return (row: Row<T>, columnId: string, filterValue: string) => {
		// 空のフィルター値の場合は全ての行を表示
		if (!filterValue || filterValue === '') return true;
		const normalizedFilterValue = normalizeQuery(filterValue);

		// 行の値を取得
		const value = getSearchableText(row.original, columnId);
		const normalizedValue = normalizeQuery(value);

		// 静的変数としてevaluatorをキャッシュ
		// filterValueごとに一度だけパースして再利用する
		const cacheKey = `custom:${columnId}:${normalizedFilterValue}`;

		// キャッシュからevaluatorを取得または新規作成
		let evaluator: (text: string) => boolean;
		if (queryParserCache.evaluatorCache.has(cacheKey)) {
			evaluator = queryParserCache.evaluatorCache.get(cacheKey)!;
		} else {
			try {
				// クエリパーサーを使用して検索条件を生成
				const parser = new QueryParser(normalizedFilterValue);
				evaluator = parser.parse();
				queryParserCache.evaluatorCache.set(cacheKey, evaluator);
			} catch {
				// パースエラーの場合は単純な文字列一致にフォールバック
				evaluator = (text: string) => text.includes(normalizedFilterValue);
				queryParserCache.evaluatorCache.set(cacheKey, evaluator);
			}
		}

		// 検索条件に基づいて行をフィルタリング
		return evaluator(normalizedValue);
	};
};

// デフォルトのカスタムフィルター関数
export const defaultCustomFilterFn = createCustomFilterFn<Record<string, unknown>>((row, columnId) => {
	const value = row[columnId];
	return value != null ? String(value) : '';
});
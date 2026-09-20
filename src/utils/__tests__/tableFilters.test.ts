import { describe, it, expect } from "bun:test";
import { createCustomFilterFn, createGlobalFilterFn, resolveColumnFilterFn } from "../tableFilters";

// photo-damage-rankingページの行型を模した型なのです
interface DamageDataWithPhoto {
	photoId: string;
	condition: string;
	photoData?: { name: string };
}

// フォト名取得ロジックを模した検索テキスト関数なのです
const getSearchableText = (row: DamageDataWithPhoto, columnId: string): string => {
	switch (columnId) {
		case "name":
			return row.photoData?.name || "";
		case "condition":
			return row.condition || "";
		default:
			return "";
	}
};

const customFilterFn = createCustomFilterFn<DamageDataWithPhoto>(getSearchableText);

// Rowオブジェクトの最小モックなのです
const mockRow = (original: DamageDataWithPhoto) => ({ original }) as never;

describe("createGlobalFilterFn", () => {
	it("accessorKeyのみの列でもカスタムfilterFnに委譲するのです", () => {
		// photo-damage-rankingページのようにaccessorKeyのみで定義された列なのです
		const columns = [
			{ accessorKey: "name", filterFn: customFilterFn },
			{ accessorKey: "condition", filterFn: customFilterFn },
		] as never[];

		const globalFilterFn = createGlobalFilterFn<DamageDataWithPhoto>((columnId) =>
			resolveColumnFilterFn<DamageDataWithPhoto>(columns, columnId),
		);

		const row = mockRow({
			photoId: "1",
			condition: "テスト条件",
			photoData: { name: "わくわくセルリアン討伐" },
		});

		// フォト名での全体検索がヒットするのです
		expect(globalFilterFn(row, "name", "セルリアン", () => {})).toBe(true);
		// 条件列での全体検索もヒットするのです
		expect(globalFilterFn(row, "condition", "テスト条件", () => {})).toBe(true);
		// 無関係なクエリはヒットしないのです
		expect(globalFilterFn(row, "name", "存在しないフォト", () => {})).toBe(false);
	});

	it("idで定義された列でもカスタムfilterFnに委譲するのです", () => {
		const columns = [{ id: "name", filterFn: customFilterFn }] as never[];

		const globalFilterFn = createGlobalFilterFn<DamageDataWithPhoto>((columnId) =>
			resolveColumnFilterFn<DamageDataWithPhoto>(columns, columnId),
		);

		const row = mockRow({
			photoId: "1",
			condition: "",
			photoData: { name: "わくわくセルリアン討伐" },
		});

		expect(globalFilterFn(row, "name", "セルリアン", () => {})).toBe(true);
	});

	it("accessorKeyとidの両方がある場合はidを優先するのです", () => {
		const columns = [
			{
				accessorKey: "name",
				id: "photoName",
				filterFn: customFilterFn,
			},
		] as never[];

		// idでもaccessorKeyでも解決できるのです
		expect(resolveColumnFilterFn<DamageDataWithPhoto>(columns, "photoName")).toBe(
			customFilterFn as never,
		);
		expect(resolveColumnFilterFn<DamageDataWithPhoto>(columns, "name")).toBe(
			customFilterFn as never,
		);
	});

	it("未定義の列はundefinedを返しフォールバックに任せるのです", () => {
		const columns = [{ accessorKey: "name", filterFn: customFilterFn }] as never[];
		expect(resolveColumnFilterFn<DamageDataWithPhoto>(columns, "unknown")).toBeUndefined();
	});
});

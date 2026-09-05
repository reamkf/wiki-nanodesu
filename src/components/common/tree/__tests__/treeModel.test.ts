import { describe, expect, test } from "bun:test";
import { filterTree, flattenVisibleTree, getVisibleTreeItems } from "../treeModel";
import { TreeItemData } from "../types";

const items: TreeItemData[] = [
	{
		id: "a",
		name: "A",
		children: [
			{
				id: "b",
				name: "B",
				children: [
					{ id: "c", name: "C" },
					{ id: "d", name: "D" },
				],
			},
			{ id: "e", name: "E" },
		],
	},
	{ id: "f", name: "F" },
];

describe("treeModel", () => {
	test("展開済みノードだけを可視項目にflattenする", () => {
		const visibleItems = flattenVisibleTree(items, { expandedIds: new Set(["a", "b"]) });

		expect(visibleItems.map((item) => item.id)).toEqual(["a", "b", "c", "d", "e", "f"]);
		expect(visibleItems.find((item) => item.id === "c")?.level).toBe(2);
	});

	test("閉じたノードの子は可視項目に含めない", () => {
		const visibleItems = flattenVisibleTree(items, { expandedIds: new Set() });

		expect(visibleItems.map((item) => item.id)).toEqual(["a", "f"]);
	});

	test("検索一致した項目の祖先と子孫を残す", () => {
		const result = filterTree(items, "c");
		const { visibleItems } = getVisibleTreeItems({
			items,
			expandedIds: new Set(),
			searchKeyword: "c",
		});

		expect(result.matchingItemIds).toEqual(new Set(["a", "b", "c"]));
		expect(result.requiredExpandedIds).toEqual(new Set(["a", "b"]));
		expect(visibleItems.map((item) => item.id)).toEqual(["a", "b", "c"]);
	});

	test("親が一致した場合は子孫をすべて表示する", () => {
		const { visibleItems } = getVisibleTreeItems({
			items,
			expandedIds: new Set(),
			searchKeyword: "a",
		});

		expect(visibleItems.map((item) => item.id)).toEqual(["a", "b", "c", "d", "e"]);
	});
});

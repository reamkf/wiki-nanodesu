import { normalizeQuery } from "@/utils/queryNormalizer";
import { TreeItemData, VisibleTreeItem } from "./types";

export interface TreeFilterResult {
	matchingItemIds: ReadonlySet<string>;
	requiredExpandedIds: ReadonlySet<string>;
}

export interface FlattenVisibleTreeOptions {
	expandedIds: ReadonlySet<string>;
	matchingItemIds?: ReadonlySet<string>;
}

export function filterTree(items: TreeItemData[], keyword: string): TreeFilterResult {
	const normalizedKeyword = normalizeQuery(keyword);
	if (!normalizedKeyword) {
		return {
			matchingItemIds: new Set(),
			requiredExpandedIds: new Set(),
		};
	}

	const matchingItemIds = new Set<string>();
	const requiredExpandedIds = new Set<string>();

	const addAncestors = (ancestorIds: string[]) => {
		ancestorIds.forEach((id) => {
			matchingItemIds.add(id);
			requiredExpandedIds.add(id);
		});
	};

	const addDescendants = (children: TreeItemData[] | undefined) => {
		children?.forEach((child) => {
			matchingItemIds.add(child.id);
			if (child.children?.length) {
				requiredExpandedIds.add(child.id);
				addDescendants(child.children);
			}
		});
	};

	const walk = (treeItems: TreeItemData[], ancestorIds: string[]): boolean => {
		let hasMatch = false;

		for (const item of treeItems) {
			const directMatch = normalizeQuery(item.name).includes(normalizedKeyword);

			if (directMatch) {
				matchingItemIds.add(item.id);
				addAncestors(ancestorIds);
				if (item.children?.length) {
					requiredExpandedIds.add(item.id);
					addDescendants(item.children);
				}
				hasMatch = true;
				continue;
			}

			const childMatch = item.children?.length
				? walk(item.children, [...ancestorIds, item.id])
				: false;

			if (childMatch) {
				matchingItemIds.add(item.id);
				requiredExpandedIds.add(item.id);
				addAncestors(ancestorIds);
				hasMatch = true;
			}
		}

		return hasMatch;
	};

	walk(items, []);
	return { matchingItemIds, requiredExpandedIds };
}

export function flattenVisibleTree(
	items: TreeItemData[],
	{ expandedIds, matchingItemIds }: FlattenVisibleTreeOptions,
): VisibleTreeItem[] {
	const visibleItems: VisibleTreeItem[] = [];

	const walk = (treeItems: TreeItemData[], level: number, parentId: string | null) => {
		for (const item of treeItems) {
			if (matchingItemIds && !matchingItemIds.has(item.id)) continue;

			const hasChildren = Boolean(item.children?.length);
			const expanded = hasChildren && expandedIds.has(item.id);
			visibleItems.push({
				item,
				id: item.id,
				level,
				parentId,
				hasChildren,
				expanded,
			});

			if (expanded) {
				walk(item.children ?? [], level + 1, item.id);
			}
		}
	};

	walk(items, 0, null);
	return visibleItems;
}

export function getVisibleTreeItems({
	items,
	expandedIds,
	searchKeyword,
}: {
	items: TreeItemData[];
	expandedIds: ReadonlySet<string>;
	searchKeyword: string;
}): { visibleItems: VisibleTreeItem[]; filterResult: TreeFilterResult } {
	const filterResult = filterTree(items, searchKeyword);
	const effectiveExpandedIds = new Set([...expandedIds, ...filterResult.requiredExpandedIds]);
	const visibleItems = flattenVisibleTree(items, {
		expandedIds: effectiveExpandedIds,
		matchingItemIds: normalizeQuery(searchKeyword) ? filterResult.matchingItemIds : undefined,
	});

	return { visibleItems, filterResult };
}

export function findParentId(items: TreeItemData[], targetId: string): string | null {
	for (const item of items) {
		if (item.children?.some((child) => child.id === targetId)) return item.id;
		if (item.children?.length) {
			const parentId = findParentId(item.children, targetId);
			if (parentId) return parentId;
		}
	}
	return null;
}

export function getTreeItemDomId(id: string): string {
	return `tree-item-${encodeURIComponent(id)}`;
}

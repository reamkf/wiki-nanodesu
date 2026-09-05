"use client";

import { useCallback, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { TreeItemData } from "./types";
import { findParentId, getVisibleTreeItems } from "./treeModel";

interface UseTreeViewOptions {
	items: TreeItemData[];
	searchKeyword?: string;
	isExpandedAllByDefault?: boolean;
}

function getInitialExpandedIds(
	items: TreeItemData[],
	isExpandedAllByDefault: boolean,
): Set<string> {
	const expandedIds = new Set<string>();

	const walk = (treeItems: TreeItemData[]) => {
		treeItems.forEach((item) => {
			const expanded = item.isExpandedByDefault ?? isExpandedAllByDefault;
			if (expanded) expandedIds.add(item.id);
			if (item.children?.length) walk(item.children);
		});
	};

	walk(items);
	return expandedIds;
}

export function useTreeView({
	items,
	searchKeyword = "",
	isExpandedAllByDefault = false,
}: UseTreeViewOptions) {
	const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(() =>
		getInitialExpandedIds(items, isExpandedAllByDefault),
	);
	const [requestedActiveId, setRequestedActiveId] = useState<string | null>(null);

	const { visibleItems, filterResult } = useMemo(
		() => getVisibleTreeItems({ items, expandedIds, searchKeyword }),
		[items, expandedIds, searchKeyword],
	);

	const activeId = useMemo(() => {
		if (!searchKeyword.trim() && requestedActiveId === null) return null;
		return visibleItems.some((visibleItem) => visibleItem.id === requestedActiveId)
			? requestedActiveId
			: (visibleItems[0]?.id ?? null);
	}, [requestedActiveId, searchKeyword, visibleItems]);

	const effectiveExpandedIds = useMemo(
		() => new Set([...expandedIds, ...filterResult.requiredExpandedIds]),
		[expandedIds, filterResult.requiredExpandedIds],
	);

	const setActiveId = useCallback((id: string | null) => {
		setRequestedActiveId(id);
	}, []);

	const toggleExpanded = useCallback((id: string) => {
		setExpandedIds((previous) => {
			const next = new Set(previous);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const expandActive = useCallback(() => {
		if (!activeId) return;
		const activeItem = visibleItems.find((item) => item.id === activeId);
		if (!activeItem?.hasChildren) return;
		setExpandedIds((previous) => new Set(previous).add(activeId));
	}, [activeId, visibleItems]);

	const collapseActive = useCallback(() => {
		if (!activeId) return;
		const activeItem = visibleItems.find((item) => item.id === activeId);
		if (!activeItem) return;

		if (expandedIds.has(activeId)) {
			setExpandedIds((previous) => {
				const next = new Set(previous);
				next.delete(activeId);
				return next;
			});
			return;
		}

		const parentId = findParentId(items, activeId);
		if (parentId) setRequestedActiveId(parentId);
	}, [activeId, expandedIds, items, visibleItems]);

	const moveToFirstChild = useCallback(() => {
		if (!activeId) return;
		const activeItem = visibleItems.find((item) => item.id === activeId);
		if (!activeItem?.hasChildren) return;

		if (!effectiveExpandedIds.has(activeId)) {
			setExpandedIds((previous) => new Set(previous).add(activeId));
			return;
		}

		const firstChild = visibleItems.find((item) => item.parentId === activeId);
		if (firstChild) setRequestedActiveId(firstChild.id);
	}, [activeId, effectiveExpandedIds, visibleItems]);

	const moveToParent = useCallback(() => {
		if (!activeId) return;
		const parentId = findParentId(items, activeId);
		if (parentId) setRequestedActiveId(parentId);
	}, [activeId, items]);

	const moveBy = useCallback(
		(offset: number) => {
			if (visibleItems.length === 0) return;
			const currentIndex = visibleItems.findIndex((item) => item.id === activeId);
			const nextIndex = Math.min(
				Math.max(currentIndex === -1 ? 0 : currentIndex + offset, 0),
				visibleItems.length - 1,
			);
			setRequestedActiveId(visibleItems[nextIndex]?.id ?? null);
		},
		[activeId, visibleItems],
	);

	const moveNext = useCallback(() => moveBy(1), [moveBy]);
	const movePrevious = useCallback(() => moveBy(-1), [moveBy]);
	const moveFirst = useCallback(
		() => setRequestedActiveId(visibleItems[0]?.id ?? null),
		[visibleItems],
	);
	const moveLast = useCallback(
		() => setRequestedActiveId(visibleItems[visibleItems.length - 1]?.id ?? null),
		[visibleItems],
	);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.nativeEvent.isComposing || !activeId) return null;

			switch (event.key) {
				case "ArrowDown":
					event.preventDefault();
					moveNext();
					break;
				case "ArrowUp":
					event.preventDefault();
					movePrevious();
					break;
				case "ArrowRight":
					event.preventDefault();
					if (effectiveExpandedIds.has(activeId)) moveToFirstChild();
					else expandActive();
					break;
				case "ArrowLeft":
					event.preventDefault();
					collapseActive();
					break;
				case "Home":
					event.preventDefault();
					moveFirst();
					break;
				case "End":
					event.preventDefault();
					moveLast();
					break;
				case "Enter":
					event.preventDefault();
					return activeId;
			}

			return null;
		},
		[
			activeId,
			collapseActive,
			effectiveExpandedIds,
			expandActive,
			moveFirst,
			moveLast,
			moveNext,
			movePrevious,
			moveToFirstChild,
		],
	);

	const activateActive = useCallback(() => activeId, [activeId]);

	return {
		expandedIds,
		effectiveExpandedIds,
		activeId,
		visibleItems,
		filterResult,
		setExpandedIds,
		setActiveId,
		toggleExpanded,
		moveNext,
		movePrevious,
		moveFirst,
		moveLast,
		moveToParent,
		moveToFirstChild,
		expandActive,
		collapseActive,
		handleKeyDown,
		activateActive,
	};
}

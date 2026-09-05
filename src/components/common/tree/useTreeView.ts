"use client";

import { useCallback, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { TreeItemData } from "./types";
import { useLinearNavigation } from "../navigation/useLinearNavigation";
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

	const { visibleItems, filterResult } = useMemo(
		() => getVisibleTreeItems({ items, expandedIds, searchKeyword }),
		[items, expandedIds, searchKeyword],
	);
	const itemIds = useMemo(() => visibleItems.map(({ id }) => id), [visibleItems]);
	const { activeId, setActiveId, moveNext, movePrevious, moveFirst, moveLast, activateActive } =
		useLinearNavigation({
			itemIds,
			autoSelectFirst: Boolean(searchKeyword.trim()),
		});

	const effectiveExpandedIds = useMemo(
		() => new Set([...expandedIds, ...filterResult.requiredExpandedIds]),
		[expandedIds, filterResult.requiredExpandedIds],
	);

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
		if (parentId) setActiveId(parentId);
	}, [activeId, expandedIds, items, setActiveId, visibleItems]);

	const moveToFirstChild = useCallback(() => {
		if (!activeId) return;
		const activeItem = visibleItems.find((item) => item.id === activeId);
		if (!activeItem?.hasChildren) return;

		if (!effectiveExpandedIds.has(activeId)) {
			setExpandedIds((previous) => new Set(previous).add(activeId));
			return;
		}

		const firstChild = visibleItems.find((item) => item.parentId === activeId);
		if (firstChild) setActiveId(firstChild.id);
	}, [activeId, effectiveExpandedIds, setActiveId, visibleItems]);

	const moveToParent = useCallback(() => {
		if (!activeId) return;
		const parentId = findParentId(items, activeId);
		if (parentId) setActiveId(parentId);
	}, [activeId, items, setActiveId]);

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

"use client";

import { useCallback, useMemo, useState } from "react";

interface UseLinearNavigationOptions {
	itemIds: ReadonlyArray<string>;
	autoSelectFirst?: boolean;
}

export function useLinearNavigation({
	itemIds,
	autoSelectFirst = false,
}: UseLinearNavigationOptions) {
	const [requestedActiveId, setRequestedActiveId] = useState<string | null>(null);

	const activeId = useMemo(() => {
		if (itemIds.length === 0) return null;
		if (!autoSelectFirst && requestedActiveId === null) return null;
		return itemIds.includes(requestedActiveId ?? "") ? requestedActiveId : itemIds[0];
	}, [autoSelectFirst, itemIds, requestedActiveId]);

	const setActiveId = useCallback((id: string | null) => {
		setRequestedActiveId(id);
	}, []);

	const moveBy = useCallback(
		(offset: number) => {
			if (itemIds.length === 0) return;
			const currentIndex = activeId === null ? -1 : itemIds.indexOf(activeId);
			const nextIndex = Math.min(
				Math.max(currentIndex === -1 ? 0 : currentIndex + offset, 0),
				itemIds.length - 1,
			);
			setRequestedActiveId(itemIds[nextIndex] ?? null);
		},
		[activeId, itemIds],
	);

	const moveNext = useCallback(() => moveBy(1), [moveBy]);
	const movePrevious = useCallback(() => moveBy(-1), [moveBy]);
	const moveFirst = useCallback(() => setRequestedActiveId(itemIds[0] ?? null), [itemIds]);
	const moveLast = useCallback(
		() => setRequestedActiveId(itemIds[itemIds.length - 1] ?? null),
		[itemIds],
	);
	const activateActive = useCallback(() => activeId, [activeId]);
	const clearActive = useCallback(() => setRequestedActiveId(null), []);

	return {
		activeId,
		setActiveId,
		moveNext,
		movePrevious,
		moveFirst,
		moveLast,
		activateActive,
		clearActive,
	};
}

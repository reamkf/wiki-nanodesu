"use client";

import React from "react";
import { TreeView } from "./tree/TreeView";
import { useTreeView } from "./tree/useTreeView";
import { TreeItemData } from "./tree/types";

export type { TreeItemData } from "./tree/types";

interface TreeListProps {
	items: TreeItemData[];
	onItemClick?: (id: string) => void;
	isExpandedAllByDefault?: boolean;
	className?: string;
	searchKeyword?: string;
}

export function TreeList({
	items,
	onItemClick,
	isExpandedAllByDefault = false,
	className = "",
	searchKeyword = "",
}: TreeListProps) {
	const tree = useTreeView({ items, searchKeyword, isExpandedAllByDefault });

	return (
		<TreeView
			items={items}
			expandedIds={tree.expandedIds}
			activeId={tree.activeId}
			visibleItems={tree.visibleItems}
			searchKeyword={searchKeyword}
			className={className}
			onExpandedChange={tree.setExpandedIds}
			onActiveChange={tree.setActiveId}
			onActivate={(id) => onItemClick?.(id)}
		/>
	);
}

"use client";

import React from "react";
import Box from "@mui/material/Box";
import { TreeItem } from "./TreeItem";
import { TreeItemData } from "./types";

export interface TreeViewProps {
	items: TreeItemData[];
	expandedIds: ReadonlySet<string>;
	activeId: string | null;
	searchKeyword?: string;
	className?: string;
	onExpandedChange: (ids: ReadonlySet<string>) => void;
	onActiveChange: (id: string | null) => void;
	onActivate: (id: string) => void;
	onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
	visibleItems: ReadonlyArray<{
		item: TreeItemData;
		id: string;
		level: number;
		parentId: string | null;
		hasChildren: boolean;
		expanded: boolean;
	}>;
}

export function TreeView({
	expandedIds,
	activeId,
	searchKeyword = "",
	className = "",
	onExpandedChange,
	onActiveChange,
	onActivate,
	onKeyDown,
	visibleItems,
}: TreeViewProps) {
	return (
		<Box id="toc-tree" role="tree" className={`pb-1 w-full ${className}`}>
			{visibleItems.map((visibleItem) => (
				<TreeItem
					key={visibleItem.id}
					visibleItem={visibleItem}
					active={visibleItem.id === activeId}
					searchKeyword={searchKeyword}
					onActiveChange={onActiveChange}
					onActivate={onActivate}
					onKeyDown={onKeyDown}
					onToggleExpanded={(id) => {
						const next = new Set(expandedIds);
						if (next.has(id)) next.delete(id);
						else next.add(id);
						onExpandedChange(next);
					}}
				/>
			))}
		</Box>
	);
}

"use client";

import React, { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { includesNormalizeQuery } from "@/utils/queryNormalizer";
import { getTreeItemDomId } from "./treeModel";
import { VisibleTreeItem } from "./types";

interface TreeItemProps {
	visibleItem: VisibleTreeItem;
	active: boolean;
	searchKeyword: string;
	onActiveChange: (id: string) => void;
	onActivate: (id: string) => void;
	onToggleExpanded: (id: string) => void;
	onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
}

export function TreeItem({
	visibleItem,
	active,
	searchKeyword,
	onActiveChange,
	onActivate,
	onToggleExpanded,
	onKeyDown,
}: TreeItemProps) {
	const rowRef = useRef<HTMLDivElement>(null);
	const { item, id, level, hasChildren, expanded } = visibleItem;
	const showActive = active;
	const directMatch = Boolean(searchKeyword && includesNormalizeQuery(item.name, searchKeyword));

	useEffect(() => {
		if (!active) return;
		rowRef.current?.scrollIntoView({ block: "nearest" });
		if (document.activeElement?.closest('[role="treeitem"]')) rowRef.current?.focus();
	}, [active]);

	return (
		<div
			ref={rowRef}
			id={getTreeItemDomId(id)}
			role="treeitem"
			tabIndex={active ? 0 : -1}
			aria-level={level + 1}
			aria-expanded={hasChildren ? expanded : undefined}
			aria-selected={active}
			onFocus={() => onActiveChange(id)}
			onKeyDown={onKeyDown}
			className="flex items-center"
			style={{ paddingLeft: `${level * 1.5}rem` }}
		>
			{hasChildren ? (
				<Box
					component="button"
					type="button"
					aria-label={expanded ? `${item.name}を折りたたむ` : `${item.name}を展開する`}
					aria-expanded={expanded}
					title={expanded ? `${item.name}を折りたたむ` : `${item.name}を展開する`}
					onClick={(event) => {
						event.stopPropagation();
						onToggleExpanded(id);
					}}
					onKeyDown={(event) => {
						if (event.key !== "Enter" && event.key !== " ") return;
						event.preventDefault();
						event.stopPropagation();
						onToggleExpanded(id);
					}}
					className="mr-1 cursor-pointer"
				>
					{expanded ? (
						<ExpandMoreIcon fontSize="small" />
					) : (
						<ChevronRightIcon fontSize="small" />
					)}
				</Box>
			) : (
				<Box component="span" className="mr-2">
					•
				</Box>
			)}

			<ListItemButton
				tabIndex={-1}
				onClick={() => {
					onActiveChange(id);
					onActivate(id);
				}}
				className={`py-1 pr-8 hover:bg-sky-100 rounded flex items-center ${
					showActive
						? "bg-sky-100 ring-2 ring-inset ring-sky-500"
						: directMatch
							? "bg-sky-50"
							: ""
				}`}
			>
				<ListItemText
					primary={item.name}
					slotProps={{
						primary: {
							className: `${level === 0 ? "text-[0.9rem] font-bold" : "text-[0.85rem]"} ${
								directMatch ? "font-medium" : ""
							}`,
						},
					}}
					className="my-0"
				/>
			</ListItemButton>
		</div>
	);
}

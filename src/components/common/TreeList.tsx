"use client";

import React, { useState, useCallback } from 'react';
import { Box, ListItemButton, ListItemText } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export interface TreeItemData {
	id: string;
	name: string;
	children?: TreeItemData[];
	defaultExpanded?: boolean; // デフォルトで展開するかどうか
}

interface TreeListProps {
	items: TreeItemData[];
	onItemClick?: (id: string) => void;
	isExpandedByDefault?: boolean; // すべての項目をデフォルトで展開するかどうか
	className?: string;
}

/**
 * 子要素を折りたたみ可能な箇条書きコンポーネント
 */
export function TreeList({
	items,
	onItemClick,
	isExpandedByDefault = false,
	className = "",
}: TreeListProps) {
	// 各アイテムの展開状態を保持するオブジェクト
	const [expandedState, setExpandedState] = useState<Record<string, boolean>>(() => {
		// 初期状態を設定
		const initialState: Record<string, boolean> = {};

		// 各アイテムについて再帰的に初期状態を設定する関数
		const initializeExpandedState = (treeItems: TreeItemData[]) => {
			treeItems.forEach(item => {
				// itemのdefaultExpandedか、それがなければdefaultAllExpandedを使用
				initialState[item.id] = item.defaultExpanded !== undefined
					? item.defaultExpanded
					: isExpandedByDefault;

				// 子要素がある場合は再帰的に処理
				if (item.children && item.children.length > 0) {
					initializeExpandedState(item.children);
				}
			});
		};

		initializeExpandedState(items);
		return initialState;
	});

	// 項目がクリックされたときの処理
	const handleItemClick = useCallback((id: string) => {
		onItemClick?.(id);
	}, [onItemClick]);

	// 展開/折りたたみトグル処理
	const handleToggleExpand = useCallback((id: string, e: React.MouseEvent) => {
		e.stopPropagation(); // 親要素へのクリックイベント伝播を防止
		setExpandedState(prev => ({
			...prev,
			[id]: !prev[id]
		}));
	}, []);

	// 再帰的にアイテムをレンダリングする関数
	const renderTreeItems = useCallback((treeItems: TreeItemData[], level = 0) => {
		return treeItems.map(item => {
			const hasChildren = !!(item.children && item.children.length > 0);
			const isExpanded = expandedState[item.id];

			return (
				<React.Fragment key={item.id}>
					<ListItemButton
						onClick={() => handleItemClick(item.id)}
						className={`
							py-1
							pr-8
							hover:bg-sky-100
							rounded flex items-center
						`}
						style={{ paddingLeft: `${level * 1.5}rem` }}
					>
						{/* 展開/折りたたみアイコン (子要素がある場合のみ) */}
						{hasChildren && (
							<Box
								component="span"
								onClick={(e) => handleToggleExpand(item.id, e)}
								className="mr-1 cursor-pointer"
							>
								{isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
							</Box>
						)}

						{/* 箇条書きの点を表示 (子要素がない場合のみ) */}
						{!hasChildren && (
							<Box
								component="span"
								className="mr-2"
							>
								•
							</Box>
						)}

						<ListItemText
							primary={item.name}
							slotProps={{
								primary: {
									className: `
										${level === 0 ? 'text-[0.9rem] font-bold' : 'text-[0.85rem]'}
									`
								}
							}}
							className="my-0"
						/>
					</ListItemButton>

					{/* 子要素があり、展開されている場合は子要素をレンダリング */}
					{hasChildren && isExpanded && (
						<Box>
							{renderTreeItems(item.children || [], level + 1)}
						</Box>
					)}
				</React.Fragment>
			);
		});
	}, [handleItemClick, handleToggleExpand, expandedState]);

	// メインのレンダリング
	return (
		<Box className={`pb-1 w-full ${className}`}>
			<div className="pt-0">
				{renderTreeItems(items)}
			</div>
		</Box>
	);
}
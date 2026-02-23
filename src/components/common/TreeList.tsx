"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { Box, ListItemButton, ListItemText } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { includesNormalizeQuery } from '@/utils/queryNormalizer';

export interface TreeItemData {
	id: string;
	name: string;
	children?: TreeItemData[];
	isExpandedByDefault?: boolean; // デフォルトで展開するかどうか
}

// 検索キーワードに一致するアイテムを含むかどうかを再帰的に確認する関数
function containsSearchKeyword(item: TreeItemData, keyword: string): boolean {
	if (!keyword) return true;

	// 自身の名前が検索キーワードを含む場合
	if (includesNormalizeQuery(item.name, keyword)) {
		return true;
	}

	// 子要素を検索
	if (item.children && item.children.length > 0) {
		return item.children.some(child => containsSearchKeyword(child, keyword));
	}

	return false;
}

interface TreeListProps {
	items: TreeItemData[];
	onItemClick?: (id: string) => void;
	isExpandedAllByDefault?: boolean; // すべての項目をデフォルトで展開するかどうか
	className?: string;
	searchKeyword?: string; // 検索キーワード
}

/**
 * 子要素を折りたたみ可能な箇条書きコンポーネント
 */
export function TreeList({
	items,
	onItemClick,
	isExpandedAllByDefault = false,
	className = "",
	searchKeyword = "",
}: TreeListProps) {
	// 各アイテムの展開状態を保持するオブジェクト
	const [expandedState, setExpandedState] = useState<Record<string, boolean>>(() => {
		// 初期状態を設定
		const initialState: Record<string, boolean> = {};

		// 各アイテムについて再帰的に初期状態を設定する関数
		const initializeExpandedState = (treeItems: TreeItemData[]) => {
			treeItems.forEach(item => {
				// itemのdefaultExpandedか、それがなければdefaultAllExpandedを使用
				initialState[item.id] = item.isExpandedByDefault !== undefined
					? item.isExpandedByDefault
					: isExpandedAllByDefault;

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

	// 検索キーワードがある場合、検索結果に基づいて展開すべきIDを計算
	const searchExpandedIds = useMemo(() => {
		if (!searchKeyword) return new Set<string>();

		const idsToExpand = new Set<string>();

		const walk = (treeItems: TreeItemData[]) => {
			treeItems.forEach(item => {
				if (containsSearchKeyword(item, searchKeyword)) {
					idsToExpand.add(item.id);

					if (includesNormalizeQuery(item.name, searchKeyword) &&
						item.children && item.children.length > 0) {
						item.children.forEach(child => {
							idsToExpand.add(child.id);
						});
					}

					if (item.children && item.children.length > 0) {
						walk(item.children);
					}
				}
			});
		};

		walk(items);
		return idsToExpand;
	}, [searchKeyword, items]);

	// ユーザー操作 + 検索による展開をマージした状態
	const effectiveExpandedState = useMemo(() => {
		if (searchExpandedIds.size === 0) return expandedState;

		const merged = { ...expandedState };
		searchExpandedIds.forEach(id => { merged[id] = true; });
		return merged;
	}, [expandedState, searchExpandedIds]);

	// 検索キーワードに一致する項目のIDを収集する
	const matchingItemIds = useMemo(() => {
		if (!searchKeyword) return new Set<string>();

		const matchIds = new Set<string>();

		// 再帰的に検索キーワードに一致する項目のIDを収集する関数
		const collectMatchingIds = (treeItems: TreeItemData[], parentIds: string[] = []) => {
			treeItems.forEach(item => {
				const currentPath = [...parentIds, item.id];
				const itemMatches = includesNormalizeQuery(item.name, searchKeyword);

				// 自身が一致する場合、自身のIDと親のIDを追加
				if (itemMatches) {
					// 自身を追加
					matchIds.add(item.id);
					// 親も全て追加
					parentIds.forEach(pid => matchIds.add(pid));

					// 子孫も全て追加（一致した項目の子孫は全て表示する）
					const addAllDescendants = (children: TreeItemData[] | undefined) => {
						if (!children) return;
						children.forEach(child => {
							matchIds.add(child.id);
							if (child.children) {
								addAllDescendants(child.children);
							}
						});
					};

					if (item.children) {
						addAllDescendants(item.children);
					}
				}

				// 子要素がある場合は再帰的に処理
				if (item.children && item.children.length > 0) {
					// 子の中に一致するものがあるか確認
					const hasMatchingChild = item.children.some(
						child => containsSearchKeyword(child, searchKeyword)
					);

					// 子の中に一致するものがある場合、自身のIDも追加
					if (hasMatchingChild && !itemMatches) {
						matchIds.add(item.id);
						// 親も全て追加
						parentIds.forEach(pid => matchIds.add(pid));
					}

					// 子要素を再帰的に処理
					collectMatchingIds(item.children, currentPath);
				}
			});
		};

		collectMatchingIds(items);
		return matchIds;
	}, [items, searchKeyword]);

	// 再帰的にアイテムをレンダリングする関数
	const renderTreeItems = (treeItems: TreeItemData[], level = 0) => {
		return treeItems.map(item => {
			const hasChildren = !!(item.children && item.children.length > 0);
			const isExpanded = effectiveExpandedState[item.id];

			// 検索キーワードがある場合、このアイテムが表示対象かどうかをチェック
			if (searchKeyword && !matchingItemIds.has(item.id)) {
				return null; // 検索結果に含まれない場合は表示しない
			}

			// 項目が検索キーワードに直接一致するかどうか
			const isDirectMatch = searchKeyword &&
				includesNormalizeQuery(item.name, searchKeyword);

			return (
				<React.Fragment key={item.id}>
					<ListItemButton
						onClick={() => handleItemClick(item.id)}
						className={`
							py-1
							pr-8
							hover:bg-sky-100
							rounded flex items-center
							${isDirectMatch ? 'bg-sky-50' : ''}
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
										${isDirectMatch ? 'font-medium' : ''}
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
		}).filter(Boolean); // nullの項目を除外
	};

	// メインのレンダリング
	return (
		<Box className={`pb-1 w-full ${className}`}>
			<div className="pt-0">
				{renderTreeItems(items)}
			</div>
		</Box>
	);
}
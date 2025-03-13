"use client";

import React, { useCallback, ReactNode } from "react";
import { Box } from "@mui/material";
import { TableOfContents } from "@/components/section/TableOfContents";
import { TreeItemData } from "../common/TreeList";
import { Heading } from "@/components/section/Heading";
import { FoldingSection } from "@/components/section/FoldingSection";

interface CategoryLayoutProps {
	categories: TreeItemData[];
	renderContent: (categoryId: string) => ReactNode;
	onSelectCategory: (id: string) => void;
	selectedCategory: string | null;
	emptyMessage?: string;
}

/**
 * カテゴリーとサブカテゴリーを表示するレイアウトコンポーネント
 * friends-skillsとabnormal-statusページで共通して使用
 */
export function CategoryLayout({
	categories,
	renderContent,
	onSelectCategory,
	selectedCategory,
	emptyMessage = "データがありません"
}: CategoryLayoutProps) {
	// カテゴリーセクションをレンダリングする関数
	const renderCategorySections = useCallback((categories: TreeItemData[], level = 1) => {
		return categories.map((category) => {
			// 子カテゴリーがある場合
			if (category.children && category.children.length > 0) {
				return (
					<div
						key={category.id}
						id={`section-${category.id}`}
					>
						<Heading
							title={category.name}
							id={category.id}
							level={level as 1 | 2 | 3}
						/>
						<div className="mt-2">
							{renderCategorySections(category.children, level + 1)}
						</div>
					</div>
				);
			}

			// サブカテゴリの場合
			const content = renderContent(category.id);
			if (!content) return null;

			return (
				<div
					key={category.id}
					id={`section-${category.id}`}
				>
					<Heading
						title={category.name}
						id={`${category.id}`}
						level={level as 1 | 2 | 3}
					/>
					<FoldingSection
						isOpenByDefault={selectedCategory === category.id}
					>
						<div className="mt-2 overflow-x-auto">
							{content || <div>{emptyMessage}</div>}
						</div>
					</FoldingSection>
				</div>
			);
		});
	}, [renderContent, selectedCategory, emptyMessage]);

	return (
		<>
			<Box>
				<div className="sticky top-0">
					<TableOfContents
						contents={categories}
						onSelect={onSelectCategory}
					/>
				</div>
			</Box>
			<Box>
				{categories.map((category) => (
					<div key={category.id} className="mb-8">
						{renderCategorySections([category])}
					</div>
				))}
			</Box>
		</>
	);
}
"use client";

import React, { ReactNode } from "react";
import Box from "@mui/material/Box";
import { TableOfContents } from "@/components/section/TableOfContents";
import { TreeItemData } from "../common/TreeList";
import { Heading } from "@/components/section/Heading";
import { FoldingSection } from "@/components/section/FoldingSection";

interface CategorySectionProps {
	category: TreeItemData;
	level: 1 | 2 | 3;
	renderContent: (categoryId: string) => ReactNode;
	selectedCategory: string | null;
	emptyMessage: string;
}

/** 個別のカテゴリーセクションを再帰的にレンダリングするコンポーネント */
function CategorySection({
	category,
	level,
	renderContent,
	selectedCategory,
	emptyMessage
}: CategorySectionProps) {
	// 子カテゴリーがある場合
	if (category.children && category.children.length > 0) {
		return (
			<div id={`section-${category.id}`}>
				<Heading
					title={category.name}
					id={category.id}
					level={level}
				/>
				<div className="mt-2">
					{category.children.map((child) => (
						<CategorySection
							key={child.id}
							category={child}
							level={Math.min(level + 1, 3) as 1 | 2 | 3}
							renderContent={renderContent}
							selectedCategory={selectedCategory}
							emptyMessage={emptyMessage}
						/>
					))}
				</div>
			</div>
		);
	}

	// リーフカテゴリの場合
	const content = renderContent(category.id);
	if (!content) return null;

	return (
		<div id={`section-${category.id}`}>
			<Heading
				title={category.name}
				id={`${category.id}`}
				level={level}
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
}

interface CategoryLayoutProps {
	categories: TreeItemData[];
	renderContent: (categoryId: string) => ReactNode;
	onItemClisk: (id: string) => void;
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
	onItemClisk,
	selectedCategory,
	emptyMessage = "データがありません"
}: CategoryLayoutProps) {
	return (
		<>
			<Box>
				<div className="sticky top-0">
					<TableOfContents
						contents={categories}
						onItemClisk={onItemClisk}
					/>
				</div>
			</Box>
			<Box>
				{categories.map((category) => (
					<div key={category.id} className="mb-8">
						<CategorySection
							category={category}
							level={1}
							renderContent={renderContent}
							selectedCategory={selectedCategory}
							emptyMessage={emptyMessage}
						/>
					</div>
				))}
			</Box>
		</>
	);
}
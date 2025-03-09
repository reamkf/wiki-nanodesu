"use client";

import React, { useCallback, ReactNode, useEffect } from "react";
import { Box } from "@mui/material";
import { TableOfContents, TableOfContentsData } from "@/components/section/TableOfContents";
import { Heading } from "@/components/section/Heading";
import { FoldingSection } from "@/components/section/FoldingSection";

interface CategoryLayoutProps {
	categories: TableOfContentsData[];
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
	// 目次クリック時の処理
	const handleTocSelect = useCallback((id: string) => {
		// カテゴリーを選択状態にする
		onSelectCategory(id);

		// IDに対応する要素を取得してスクロール
		setTimeout(() => {
			const element = document.getElementById(`section-${id}`);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}, 100); // セクションが展開される時間を少し待つ
	}, [onSelectCategory]);

	// カテゴリーセクションをレンダリングする関数
	const renderCategorySections = useCallback((categories: TableOfContentsData[], level = 1) => {
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
							id={`heading-${category.id}`}
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
						id={`heading-${category.id}`}
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

	// URLハッシュに基づいて初期ロード時にスクロール
	useEffect(() => {
		if (window.location.hash) {
			const id = window.location.hash.substring(1);
			const element = document.getElementById(`section-${id}`);
			if (element) {
				setTimeout(() => {
					element.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}, 300);
			}
		}
	}, []);

	return (
		<>
			<Box>
				<div className="sticky top-0">
					<TableOfContents
						contents={categories}
						onSelect={handleTocSelect}
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
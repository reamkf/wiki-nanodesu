"use client";

import React from 'react';
import { Box, Typography, List, ListItemButton, ListItemText } from '@mui/material';

// スキルカテゴリーの階層構造を表す型
interface SkillCategory {
	name: string;
	id: string;
	children?: SkillCategory[];
}

interface TableOfContentsProps {
	/**
	 * 階層化されたカテゴリーの配列
	 */
	categories: SkillCategory[];

	/**
	 * 現在選択されているカテゴリーのID
	 */
	selectedId: string | null;

	/**
	 * カテゴリー選択時のコールバック
	 */
	onSelect: (id: string) => void;
}

/**
 * シンプルな箇条書き形式の目次コンポーネント
 */
export function TableOfContents({
	categories,
	selectedId,
	onSelect
}: TableOfContentsProps) {
	// 再帰的にカテゴリーをレンダリングする関数
	const renderCategoryTree = (items: SkillCategory[], level = 0) => {
		return items.map(item => {
			const hasChildren = item.children && item.children.length > 0;
			const isSelected = selectedId === item.id;

			return (
				<React.Fragment key={item.id}>
					<ListItemButton
						onClick={() => onSelect(item.id)}
						className={`
							py-0
							${level * 4 + 1 === 1 ? 'pl-1' : level * 4 + 1 === 5 ? 'pl-5' : level * 4 + 1 === 9 ? 'pl-9' : 'pl-[' + (level * 4 + 1) + 'px]'}
							pr-1
							${isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'bg-transparent hover:bg-gray-100'}
							rounded flex items-center
						`}
					>
						{/* 箇条書きの点を表示 */}
						<Box
							component="span"
							className={`mr-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}
						>
							•
						</Box>

						<ListItemText
							primary={item.name}
							primaryTypographyProps={{
								className: `
									${level === 0 ? 'text-[0.9rem]' : 'text-[0.85rem]'}
									${isSelected ? 'font-bold' : (level === 0 ? 'font-semibold' : 'font-normal')}
									${isSelected ? 'text-blue-600' : 'text-gray-900'}
								`
							}}
							className="my-0"
						/>
					</ListItemButton>

					{hasChildren && renderCategoryTree(item.children || [], level + 1)}
				</React.Fragment>
			);
		});
	};

	return (
		<>
			<Box>
				<Typography variant="subtitle1" className="font-bold">
					目次
				</Typography>
			</Box>

			<Box
				className="pb-1"
			>
				<List
					dense
					component="div"
					disablePadding
					className="pt-0"
				>
					{renderCategoryTree(categories)}
				</List>
			</Box>
		</>
	);
}
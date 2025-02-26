"use client";

import React from 'react';
import { Box, List, ListItemButton, ListItemText } from '@mui/material';
import { FoldingSection } from './FoldingSection';

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
	 * カテゴリー選択時のコールバック
	 */
	onSelect: (id: string) => void;
}

/**
 * シンプルな箇条書き形式の目次コンポーネント
 */
export function TableOfContents({
	categories,
	onSelect
}: TableOfContentsProps) {
	// 再帰的にカテゴリーをレンダリングする関数
	const renderCategoryTree = (items: SkillCategory[], level = 0) => {
		return items.map(item => {
			const hasChildren = item.children && item.children.length > 0;

			return (
				<React.Fragment key={item.id}>
					<ListItemButton
						onClick={() => onSelect(item.id)}
						className={`
							py-0
							pr-8
							hover:bg-sky-100
							rounded flex items-center
						`}
						style={{ paddingLeft: `${level * 1.5}rem` }}
					>
						{/* 箇条書きの点を表示 */}
						<Box
							component="span"
							className='mr-2'
						>
							•
						</Box>

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

					{hasChildren && renderCategoryTree(item.children || [], level + 1)}
				</React.Fragment>
			);
		});
	};

	return (
		<FoldingSection toggleButtonLabel={<span className="font-bold">目次</span>}>
			<>
				<Box
					className="pb-1 w-fit"
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
		</FoldingSection>
	);
}
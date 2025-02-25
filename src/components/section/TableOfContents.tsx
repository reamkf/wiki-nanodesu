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
						sx={{
							py: 0,
							pl: level * 4 + 1,
							pr: 1,
							backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
							'&:hover': {
								backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)'
							},
							borderRadius: '4px',
							display: 'flex',
							alignItems: 'center'
						}}
					>
						{/* 箇条書きの点を表示 */}
						<Box
							component="span"
							sx={{
								mr: 1,
								color: isSelected ? 'primary.main' : 'text.secondary'
							}}
						>
							•
						</Box>

						<ListItemText
							primary={item.name}
							primaryTypographyProps={{
								fontSize: level === 0 ? '0.9rem' : '0.85rem',
								fontWeight: isSelected ? 'bold' : (level === 0 ? 600 : 400),
								color: isSelected ? 'primary.main' : 'text.primary'
							}}
							sx={{ my: 0 }}
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
				<Typography variant="subtitle1" fontWeight="bold">
					目次
				</Typography>
			</Box>

			<Box
				sx={{
					pb: 1
				}}
			>
				<List
					dense
					component="div"
					disablePadding
					sx={{ pt: 0 }}
				>
					{renderCategoryTree(categories)}
				</List>
			</Box>
		</>
	);
}
"use client";

import React from 'react';
import { Typography, Box, IconButton } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

interface SectionHeadingProps {
	title: string;
	id: string; // アンカーリンク用のID
	level?: 1 | 2 | 3;

	isOpen: boolean;
	onToggle: () => void;

	className?: string;
}

/**
 * 折りたたみ可能なセクション見出しコンポーネント
 */
export function SectionHeading({
	title,
	id,
	isOpen,
	onToggle,
	level = 1,
	className
}: SectionHeadingProps) {
	// 見出しレベルに応じたMUIのvariantを取得
	const getVariant = () => {
		switch (level) {
			case 1: return 'h5';
			case 2: return 'h6';
			case 3: return 'subtitle1';
			default: return 'h5';
		}
	};

	// レベルに応じたスタイルを取得
	const getBorderStyle = () => {
		switch (level) {
			case 1: return {
				borderBottom: '3px solid #2196f3', // 青いボーダー
				backgroundColor: '#f5f5f5', // 薄い灰色背景
			};
			case 2: return {
				borderBottom: '2px solid #2196f3', // 細い青いボーダー
				backgroundColor: 'transparent', // 背景なし
			};
			case 3: return {
				borderBottom: '2px solid #909090', // 灰色ボーダー
				backgroundColor: 'transparent', // 背景なし
			};
			default: return {
				borderBottom: '2px solid #2196f3',
				backgroundColor: '#f5f5f5',
			};
		}
	};

	const borderStyle = getBorderStyle();

	return (
		<Box
			id={id}
			className={className}
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				pt: 0.5,
				pb: 0.25,
				pl: 1,
				scrollMarginTop: '2rem',
				transition: 'all 0.3s ease',
				...borderStyle,
				'&:hover': {
					boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
				}
			}}
		>
			<Typography
				variant={getVariant()}
				component={`h${level}`}
				sx={{
					fontWeight: level <= 2 ? 600 : 500,
					fontSize: level === 1 ? '1.1rem' : level === 2 ? '1rem' : '0.9rem',
					flexGrow: 1,
					cursor: 'pointer',
					letterSpacing: '0.01em',
					color: level === 1 ? '#424242' : '#616161',
				}}
				onClick={onToggle}
			>
				{title}
			</Typography>

			<IconButton
				onClick={onToggle}
				size="small"
				aria-label={isOpen ? '折りたたむ' : '展開する'}
				sx={{
					color: '#757575',
					'&:hover': {
						backgroundColor: 'rgba(0, 0, 0, 0.04)',
					}
				}}
			>
				{isOpen ? <ExpandLess /> : <ExpandMore />}
			</IconButton>
		</Box>
	);
}
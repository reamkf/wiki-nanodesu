"use client";

import React from 'react';
import { Typography, Box } from '@mui/material';

interface SectionHeadingProps {
	title: string;
	id: string; // アンカーリンク用のID
	level?: 1 | 2 | 3;
	className?: string;
}

/**
 * シンプルなセクション見出しコンポーネント
 */
export function Heading({
	title,
	id,
	level = 1,
	className,
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
				borderBottom: '1px solid #808080', // 灰色ボーダー
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
				pb: level === 1 ? 0.25 : level === 2 ? 0.125 : 0,
				pl: level === 1 ? 1 : 0.5,
				mb: 2,
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
					fontWeight: 600,
					fontSize: level === 1 ? '1.1rem' : level === 2 ? '1rem' : '0.9rem',
					flexGrow: 1,
					letterSpacing: '0.01em',
					color: level < 3 ? '#424242' : '#101010',
				}}
			>
				{title}
			</Typography>
		</Box>
	);
}
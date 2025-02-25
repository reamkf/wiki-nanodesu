"use client";

import React from 'react';
import { Typography, Box, IconButton, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

interface SectionHeadingProps {
	title: string;
	id: string; // アンカーリンク用のID
	level?: 1 | 2 | 3;

	isOpen: boolean;
	onToggle: () => void;

	className?: string;
	children?: React.ReactNode; // 子要素を追加
}

/**
 * 折りたたみ可能なセクション見出しコンポーネント
 * 子要素が渡された場合、それを折りたたみコンテンツとして表示する
 */
export function SectionHeading({
	title,
	id,
	isOpen,
	onToggle,
	level = 1,
	className,
	children
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
		<>
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
					mb: children ? 1 : 2, // 子要素がある場合はマージンを調整
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
						cursor: 'pointer',
						letterSpacing: '0.01em',
						color: level < 3 ? '#424242' : '#101010',
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

			{/* 子要素が渡された場合、Collapseコンポーネントで囲む */}
			{children && (
				<Collapse in={isOpen} sx={{ mb: 2 }}>
					{children}
				</Collapse>
			)}
		</>
	);
}
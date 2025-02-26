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

	const getBorderClasses = () => {
		switch (level) {
			case 1: return 'border-b-[3px] border-[#2196f3] bg-[#f5f5f5]';
			case 2: return 'border-b-2 border-[#2196f3] bg-transparent';
			case 3: return 'border-b border-[#808080] bg-transparent';
			default: return 'border-b-2 border-[#2196f3] bg-[#f5f5f5]';
		}
	};

	const getSpacingClasses = () => {
		const paddingTop = 'pt-2';
		const paddingBottom = level === 1 ? 'pb-2' : level === 2 ? 'pb-0.5' : 'pb-0';
		const paddingLeft = level === 1 ? 'pl-2' : level === 2 ? 'pl-1' : 'pl-0';

		return `${paddingTop} ${paddingBottom} ${paddingLeft} mb-1`;
	};

	const getTypographyClasses = () => {
		const fontSize = level === 1 ? 'text-[1.1rem]' : level === 2 ? 'text-[1rem]' : 'text-[0.9rem]';
		const textColor = level < 3 ? 'text-[#424242]' : 'text-[#101010]';

		return `font-semibold ${fontSize} flex-grow tracking-[0.01em] ${textColor}`;
	};

	return (
		<Box
			id={id}
			className={`
				flex items-center justify-between
				${getSpacingClasses()}
				scroll-mt-8
				transition-all duration-300 ease-in-out
				border-b border-solid ${getBorderClasses()}
				hover:shadow-sm
				${className || ''}
			`}
		>
			<Typography
				variant={getVariant()}
				component={`h${level}`}
				className={getTypographyClasses()}
			>
				{title}
			</Typography>
		</Box>
	);
}
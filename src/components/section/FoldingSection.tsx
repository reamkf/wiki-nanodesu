"use client";

import React, { useState } from 'react';
import { Box, Button, Collapse } from '@mui/material';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import IndeterminateCheckBoxOutlinedIcon from '@mui/icons-material/IndeterminateCheckBoxOutlined';

interface FoldingSectionProps {
	isOpenByDefault?: boolean;
	onToggle?: () => void;
	className?: string;
	children?: React.ReactNode;
	toggleButtonLabel?: string | React.ReactNode | null,
	closeButtonLabel?: string | React.ReactNode | null,
}

/**
 * 折りたたみ可能なセクションコンポーネント
 * - ヘッダーから完全に独立
 * - 開閉アニメーション付き
 * - 折りたたまれた状態では子コンテンツをレンダリングしない
 * - 上部と下部に折りたたみボタンを配置
 */
export function FoldingSection({
	isOpenByDefault: isOpenByDefault = false,
	onToggle = () => {},
	className,
	children,
	toggleButtonLabel = null,
	closeButtonLabel = '[閉じる]',
}: FoldingSectionProps) {
	// コンテンツが一度でも開かれたかどうかを追跡
	const [isOpened, setIsOpened] = useState(isOpenByDefault);

	// 開く際に追跡状態を更新
	const handleToggle = () => {
		setIsOpened(!isOpened);
		if (onToggle) {
			onToggle();
		}
	};

	const iconClassName = 'text-xl min-w-0 p-0 m-0';

	// トグルボタンコンポーネント - 上部と下部で再利用
	const ToggleButton = ({
		useIcon = true,
		labelText = null,
	}: {
		useIcon?: boolean;
		labelText?: string | React.ReactNode | null;
	}) => {
		return (
			<Button
				onClick={handleToggle}
				variant="text"
				size="small"
				className="text-gray-500 hover:bg-gray-100 m-0 p-0 my-1 min-w-0"
			>
				{useIcon && (
					isOpened ?
						<IndeterminateCheckBoxOutlinedIcon className={iconClassName} /> :
						<AddBoxOutlinedIcon className={iconClassName} />
				)}
				{labelText && <span className='ml-1 text-black translate-y-[1px]'>{labelText}</span>}
			</Button>
		);
	};

	return (
		<Box className={className}>
			{/* 上部トグルボタン+ラベル */}
			<ToggleButton useIcon={true} labelText={toggleButtonLabel}/>

			{/* コンテンツ部分 */}
			<Collapse
				in={isOpened}
				timeout={300}
				unmountOnExit={false}
				className="ml-[0.6rem] pl-4 border-l-[1px] border-gray-400"
			>
				{children}
			</Collapse>

			{/* 下部閉じるボタン(セクションが開いている場合のみ表示) */}
			{isOpened && <ToggleButton useIcon={false} labelText={closeButtonLabel} />}
		</Box>
	);
}
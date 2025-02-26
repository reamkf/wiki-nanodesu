"use client";

import React, { useState } from 'react';
import { Box, Button, Collapse } from '@mui/material';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import IndeterminateCheckBoxOutlinedIcon from '@mui/icons-material/IndeterminateCheckBoxOutlined';

interface FoldingSectionProps {
	isOpen: boolean;
	onToggle: () => void;
	className?: string;
	children?: React.ReactNode;
	toggleButtonLabel?: string | null,
	closeButtonLabel?: string | null,
}

/**
 * 折りたたみ可能なセクションコンポーネント
 * - ヘッダーから完全に独立
 * - 開閉アニメーション付き
 * - 折りたたまれた状態では子コンテンツをレンダリングしない
 * - 上部と下部に折りたたみボタンを配置
 */
export function FoldingSection({
	isOpen,
	onToggle,
	className,
	children,
	toggleButtonLabel = '',
	closeButtonLabel = '[閉じる]',
}: FoldingSectionProps) {
	// コンテンツが一度でも開かれたかどうかを追跡
	const [hasBeenOpened, setHasBeenOpened] = useState(isOpen);

	// 開く際に追跡状態を更新
	const handleToggle = () => {
		if (!isOpen) {
			setHasBeenOpened(true);
		}
		onToggle();
	};

	// トグルボタンコンポーネント - 上部と下部で再利用
	const ToggleButton = ({
		useIcon = true,
		labelText = null,
	}: {
		useIcon?: boolean;
		labelText?: string | null;
	}) => {
		return (
			<Button
				onClick={handleToggle}
				variant="text"
				size="small"
				className="text-gray-500 flex flex-1 m-0 p-0 min-w-0"
			>
				{useIcon && (
					isOpen ?
						<IndeterminateCheckBoxOutlinedIcon className='text-[1.2rem]' /> :
						<AddBoxOutlinedIcon className='text-[1.2rem]' />
				)}
				<span className='m-1 text-yellow-900'>{labelText}</span>
			</Button>
		);
	};

	return (
		<Box className={className}>
			{/* 上部トグルボタン+ラベル */}
			<ToggleButton useIcon={true} labelText={toggleButtonLabel}/>

			{/* コンテンツ部分 */}
			<Collapse
				in={isOpen}
				timeout={300}
				unmountOnExit={!hasBeenOpened}
				className="ml-[0.6rem] pl-4 border-l-[1px] border-gray-400"
			>
				{/* isOpenがfalseでも、一度開いたことがあればDOMには存在（非表示）*/}
				{(isOpen || hasBeenOpened) && children}
			</Collapse>

			{/* 下部閉じるボタン(セクションが開いている場合のみ表示) */}
			{isOpen && <ToggleButton useIcon={false} labelText={closeButtonLabel} />}
		</Box>
	);
}
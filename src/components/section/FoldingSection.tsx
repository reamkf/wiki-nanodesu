"use client";

import React, { useState, useRef } from 'react';
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

function ToggleButton({
	useIcon = true,
	labelText = null,
	isOpened,
	onToggle,
}: {
	useIcon?: boolean;
	labelText?: string | React.ReactNode | null;
	isOpened: boolean;
	onToggle: () => void;
}) {
	const iconClassName = 'text-xl min-w-0 p-0 m-0';

	return (
		<Button
			onClick={onToggle}
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
}

/**
 * 折りたたみ可能なセクションコンポーネント
 * - 開閉アニメーション付き
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
	const sectionRef = useRef<HTMLDivElement>(null);

	// 初期状態をデフォルト値から設定
	const [isOpened, setIsOpened] = useState(isOpenByDefault);

	// 開く際に追跡状態を更新
	const handleToggle = () => {
		setIsOpened(!isOpened);

		// クローズ時、セクションの上部までスクロール
		if (isOpened && sectionRef.current) {
			// 要素の位置情報を取得
			const rect = sectionRef.current?.getBoundingClientRect();

			// 要素が画面上部外にある場合のみスクロール
			if (rect && rect.top < 0) {
				sectionRef.current?.scrollIntoView({
					behavior: 'smooth',
					block: 'start'
				});
			}
		}

		if (onToggle) {
			onToggle();
		}
	};

	return (
		<Box className={className} ref={sectionRef}>
			{/* 上部トグルボタン+ラベル */}
			<ToggleButton useIcon={true} labelText={toggleButtonLabel} isOpened={isOpened} onToggle={handleToggle}/>

			{/* コンテンツ部分 */}
			<Collapse
				in={isOpened}
				timeout={200}
				unmountOnExit={true}
				className="ml-[0.6rem] pl-[0.6rem] border-l-[1px] border-gray-400 overflow-x-auto"
			>
				{children}
			</Collapse>

			{/* 下部閉じるボタン(セクションが開いている場合のみ表示) */}
			{isOpened && <ToggleButton useIcon={false} labelText={closeButtonLabel} isOpened={isOpened} onToggle={handleToggle} />}
		</Box>
	);
}

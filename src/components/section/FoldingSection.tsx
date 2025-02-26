"use client";

import React, { useState, useEffect, useRef } from 'react';
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
	sectionId?: string; // セクションの固有ID
}

/**
 * 折りたたみ可能なセクションコンポーネント
 * - 開閉アニメーション付き
 * - 上部と下部に折りたたみボタンを配置
 * - sectionIdを指定するとlocalStorageに開閉状態を保存
 */
export function FoldingSection({
	isOpenByDefault: isOpenByDefault = false,
	onToggle = () => {},
	className,
	children,
	toggleButtonLabel = null,
	closeButtonLabel = '[閉じる]',
	sectionId,
}: FoldingSectionProps) {
	const storageKey = sectionId ? `wiki-nanodesu.foldingSection.${sectionId}` : null;
	const sectionRef = useRef<HTMLDivElement>(null);

	// 初期状態をデフォルト値から設定し、localStorageの読み込みはuseEffectで行う
	const [isOpened, setIsOpened] = useState(isOpenByDefault);

	// クライアント側でのみ実行される初期化用Effect
	useEffect(() => {
		// クライアント側でlocalStorageから状態を読み込む
		if (typeof window !== 'undefined' && storageKey) {
			const savedState = localStorage.getItem(storageKey);
			if (savedState !== null) {
				setIsOpened(JSON.parse(savedState));
			}
		}
	}, [storageKey, isOpenByDefault]);

	// 開閉状態が変更されたらlocalStorageに保存
	useEffect(() => {
		if (typeof window !== 'undefined' && storageKey) {
			localStorage.setItem(storageKey, JSON.stringify(isOpened));
		}
	}, [isOpened, storageKey]);

	// 開く際に追跡状態を更新
	const handleToggle = () => {
		setIsOpened(!isOpened);

		// クローズ時、セクションの上部までスクロール
		if (isOpened && sectionRef.current) {
			setTimeout(() => {
				// 要素の位置情報を取得
				const rect = sectionRef.current?.getBoundingClientRect();

				// 要素が画面上部外にある場合のみスクロール
				if (rect && rect.top < 0) {
					sectionRef.current?.scrollIntoView({
						behavior: 'smooth',
						block: 'start'
					});
				}
			}, 100);
		}

		if (onToggle) {
			onToggle();
		}
	};


	// トグルボタンコンポーネント - 上部と下部で再利用
	const ToggleButton = ({
		useIcon = true,
		labelText = null,
	}: {
		useIcon?: boolean;
		labelText?: string | React.ReactNode | null;
	}) => {
		const iconClassName = 'text-xl min-w-0 p-0 m-0';

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
		<Box className={className} ref={sectionRef}>
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
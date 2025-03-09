"use client";

import React, { Fragment, useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, Transition, DialogTitle, DialogPanel, TransitionChild } from "@headlessui/react";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, ListItemButton, ListItemText } from '@mui/material';

export interface TableOfContentsData {
	name: string;
	id: string;
	children?: TableOfContentsData[];
}

interface TableOfContentsProps {
	contents: TableOfContentsData[];
	onSelect: (id: string) => void;
}

/**
 * シンプルな箇条書き形式の目次コンポーネント
 */
export function TableOfContents({
	contents: categories,
	onSelect,
}: TableOfContentsProps) {
	const [open, setOpen] = useState(false);
	const [showButton, setShowButton] = useState(false);

	// スクロールを監視して、一定以上スクロールしたらボタンを表示する
	useEffect(() => {
		const handleScroll = () => {
			// 100px以上スクロールしたらボタンを表示
			setShowButton(window.scrollY > 100);
		};

		window.addEventListener('scroll', handleScroll);
		// 初期表示時にもチェック
		handleScroll();

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	// ダイアログを開く
	const handleOpenDialog = useCallback(() => {
		setOpen(true);
	}, []);

	// ダイアログを閉じる
	const handleCloseDialog = useCallback(() => {
		setOpen(false);
	}, []);

	// 目次項目がクリックされたとき
	const handleItemClick = useCallback((id: string) => {
		// まずダイアログを閉じる
		setOpen(false);

		// ダイアログの閉じるアニメーション（200ms）が完了してからonSelectを呼び出す
		setTimeout(() => {
			onSelect(id);
		}, 200);
	}, [onSelect]);

	// 再帰的にカテゴリーをレンダリングする関数
	const renderCategoryTree = useCallback((items: TableOfContentsData[], level = 0) => {
		return items.map(item => {
			const hasChildren = !!(item.children && item.children.length > 0);

			return (
				<React.Fragment key={item.id}>
					<ListItemButton
						onClick={() => handleItemClick(item.id)}
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
	}, [handleItemClick]);

	// 目次のコンテンツ部分
	const tocContent = useMemo(() => (
		<Box className="pb-1 w-full max-h-[80vh] overflow-y-auto">
			<div className="pt-0">
				{renderCategoryTree(categories)}
			</div>
		</Box>
	), [categories, renderCategoryTree]);

	// 共通の目次ボタン
	const tocButton = useMemo(() => (
		<Button
			onClick={handleOpenDialog}
			startIcon={<MenuIcon />}
			className="
				bg-sky-100
				hover:bg-sky-200
				text-gray-800
				rounded-lg
				normal-case
				px-4
				py-2
				flex
				items-center
				justify-center
				text-sm
				font-bold
				text-sky-700
			"
			disableRipple
			disableElevation
		>
			目次
		</Button>
	), [handleOpenDialog]);

	return (
		<>
			{/* スクロール時の固定ボタン */}
			{showButton && (
				<Box
					className="fixed top-4 right-4 z-50"
				>
					{tocButton}
				</Box>
			)}

			{/* 通常表示の目次ボタン */}
			{!showButton && (
				<Box
					className="mb-4"
				>
					{tocButton}
				</Box>
			)}

			{/* AboutModal.tsxと同じ実装のダイアログ */}
			<Transition appear show={open} as={Fragment}>
				<Dialog as="div" className="relative z-10" onClose={handleCloseDialog}>
					<TransitionChild
						as={Fragment}
						enter="ease-out duration-300"
						enterFrom="opacity-0"
						enterTo="opacity-100"
						leave="ease-in duration-200"
						leaveFrom="opacity-100"
						leaveTo="opacity-0"
					>
						<div className="fixed inset-0 bg-black/25" />
					</TransitionChild>

					<div className="fixed inset-0 overflow-y-auto">
						<div className="flex min-h-full items-center justify-center p-4 text-center">
							<TransitionChild
								as={Fragment}
								enter="ease-out duration-300"
								enterFrom="opacity-0 scale-95"
								enterTo="opacity-100 scale-100"
								leave="ease-in duration-200"
								leaveFrom="opacity-100 scale-100"
								leaveTo="opacity-0 scale-95"
							>
								<DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
									<div className="flex justify-between items-center mb-4">
										<DialogTitle as="h3" className="text-lg font-bold leading-6 text-gray-900">
											目次
										</DialogTitle>
										<button
											onClick={handleCloseDialog}
											className="text-gray-500 hover:text-gray-700 focus:outline-none"
										>
											<CloseIcon />
										</button>
									</div>
									{tocContent}
								</DialogPanel>
							</TransitionChild>
						</div>
					</div>
				</Dialog>
			</Transition>
		</>
	);
}
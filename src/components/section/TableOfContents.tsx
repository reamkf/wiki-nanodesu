"use client";

import React, { useState, useEffect } from 'react';
import { Box, List, ListItemButton, ListItemText, IconButton, Dialog, DialogContent, DialogTitle, Zoom, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

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
	const handleOpenDialog = () => {
		setOpen(true);
	};

	// ダイアログを閉じる
	const handleCloseDialog = () => {
		setOpen(false);
	};

	// 目次項目がクリックされたとき
	const handleItemClick = (id: string) => {
		onSelect(id);
		setOpen(false); // ダイアログを閉じる
	};

	// 再帰的にカテゴリーをレンダリングする関数
	const renderCategoryTree = (items: TableOfContentsData[], level = 0) => {
		return items.map(item => {
			const hasChildren = item.children && item.children.length > 0;

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
	};

	// 目次のコンテンツ部分
	const tocContent = (
		<Box
			className="pb-1 w-fit"
		>
			<List
				dense
				component="div"
				disablePadding
				className="pt-0"
			>
				{renderCategoryTree(categories)}
			</List>
		</Box>
	);

	// 共通の目次ボタン
	const tocButton = (
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
	);

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

			{/* オーバーレイダイアログ */}
			<Dialog
				open={open}
				onClose={handleCloseDialog}
				maxWidth="sm"
				fullWidth={true}
				slots={{
					transition: Zoom
				}}
			>
				<DialogTitle className="flex justify-between items-center">
					<span className="font-bold">目次</span>
					<IconButton onClick={handleCloseDialog} edge="end" aria-label="閉じる">
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					{tocContent}
				</DialogContent>
			</Dialog>
		</>
	);
}
"use client";

import React, { useState, useEffect } from 'react';
import { Box, List, ListItemButton, ListItemText, IconButton, Dialog, DialogContent, DialogTitle, Zoom, Button } from '@mui/material';
import { FoldingSection } from './FoldingSection';
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

	// スクロールを監視して、目次が画面外になったらボタンを表示する
	useEffect(() => {
		const handleScroll = () => {
			const tocElement = document.getElementById('table-of-contents');
			if (tocElement) {
				const rect = tocElement.getBoundingClientRect();
				// 目次が画面上部から出たらボタンを表示
				setShowButton(rect.top < 0);
			}
		};

		window.addEventListener('scroll', handleScroll);
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

	return (
		<>
			{/* 常に表示されるボタン */}
			{showButton && (
				<Box
					className="fixed top-4 right-4 z-50"
				>
					<Button
						onClick={handleOpenDialog}
						startIcon={<MenuIcon />}
						className="
							bg-gray-100
							hover:bg-gray-200
							text-gray-800
							shadow-md
							rounded-lg
							normal-case
							px-4
							py-2
							flex
							items-center
							justify-center
							text-sm
						"
						disableRipple
						disableElevation
					>
						目次
					</Button>
				</Box>
			)}

			{/* オーバーレイダイアログ */}
			<Dialog
				open={open}
				onClose={handleCloseDialog}
				fullWidth
				maxWidth="xs"
				TransitionComponent={Zoom}
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

			{/* 通常の目次表示 */}
			<div id="table-of-contents">
				<FoldingSection
					toggleButtonLabel={<span className="font-bold">目次</span>}
					isOpenByDefault={true}
				>
					<>
						{tocContent}
					</>
				</FoldingSection>
			</div>
		</>
	);
}
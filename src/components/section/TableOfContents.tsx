"use client";

import React, { Fragment, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Dialog, Transition, DialogTitle, DialogPanel, TransitionChild } from "@headlessui/react";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button } from '@mui/material';
import { TreeList, TreeItemData } from '../common/TreeList';

interface TableOfContentsProps {
	contents: TreeItemData[];
	onSelect?: (id: string) => void; // オプショナルに変更
}

/**
 * シンプルな箇条書き形式の目次コンポーネント
 */
export function TableOfContents({
	contents,
	onSelect,
}: TableOfContentsProps) {
	const [open, setOpen] = useState(false);
	const [showButton, setShowButton] = useState(false);
	const normalButtonRef = useRef<HTMLDivElement>(null);

	// 指定されたIDのセクションにスクロールする関数
	const scrollToSection = useCallback((id: string) => {
		const element = document.getElementById(`heading-${id}`);
		if (element) {
			setTimeout(() => {
				element.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 200);
		} else {
			console.error(`Element with id ${id} not found`);
		}
	}, []);

	// 通常表示のボタンが画面外になったときだけボタンを表示する
	useEffect(() => {
		// IntersectionObserverの作成
		const observer = new IntersectionObserver(
			(entries) => {
				// 監視対象要素の可視状態が変化したとき
				const isVisible = entries[0]?.isIntersecting ?? false;
				// 要素が画面外のときだけボタンを表示
				setShowButton(!isVisible);
			},
			{ threshold: 0 } // 少しでも見えなくなったら検出
		);

		// 通常表示のボタン要素を監視対象に追加
		if (normalButtonRef.current) {
			observer.observe(normalButtonRef.current);
		}

		return () => {
			// コンポーネントのアンマウント時に監視を解除
			observer.disconnect();
		};
	}, []);

	// ページ表示時にURLハッシュに基づいてスクロール
	useEffect(() => {
		if (window.location.hash) {
			const id = window.location.hash.substring(1);
			const decodedId = decodeURIComponent(id);
			scrollToSection(decodedId);
		}
	}, [scrollToSection]);

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

		// ダイアログの閉じるアニメーション（200ms）が完了してから処理を実行
		setTimeout(() => {
			// URLのハッシュを更新
			window.history.pushState({}, '', `#${id}`);

			// セクションにスクロール
			scrollToSection(id);

			// 親コンポーネントのonSelect関数があれば呼び出す
			if (onSelect) {
				onSelect(id);
			}
		}, 200);
	}, [onSelect, scrollToSection]);

	// 目次のコンテンツ部分
	const tocContent = useMemo(() => (
		<Box className="pb-1 w-full max-h-[80vh] overflow-y-auto">
			<TreeList
				items={contents}
				onItemClick={handleItemClick}
			/>
		</Box>
	), [contents, handleItemClick]);

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
			<Transition
				as={Fragment}
				show={showButton}
				enter="transition-opacity duration-200"
				enterFrom="opacity-0"
				enterTo="opacity-100"
				leave="transition-opacity duration-200"
				leaveFrom="opacity-100"
				leaveTo="opacity-0"
			>
				<Box
					className="fixed top-4 right-4 z-50"
				>
					{tocButton}
				</Box>
			</Transition>

			{/* 通常表示の目次ボタン */}
			<Box className="my-2" ref={normalButtonRef}>
				{tocButton}
			</Box>

			{/* AboutModal.tsxと同じ実装のダイアログ */}
			<Transition appear show={open} as={Fragment}>
				<Dialog as="div" className="relative z-10" onClose={handleCloseDialog}>
					<TransitionChild
						as={Fragment}
						enter="ease-out duration-200"
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
								enter="ease-out duration-200"
								enterFrom="opacity-0 scale-95"
								enterTo="opacity-100 scale-100"
								leave="ease-in duration-200"
								leaveFrom="opacity-100 scale-100"
								leaveTo="opacity-0 scale-95"
							>
								<DialogPanel className="w-xl max-w-[85vw] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
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
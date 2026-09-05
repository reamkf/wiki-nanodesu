"use client";

import React, { Fragment, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Dialog, Transition, DialogTitle, DialogPanel, TransitionChild } from "@headlessui/react";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import { TreeView } from "../common/tree/TreeView";
import { getTreeItemDomId } from "../common/tree/treeModel";
import { useTreeView } from "../common/tree/useTreeView";
import { TreeItemData } from "../common/tree/types";

interface TableOfContentsProps {
	contents: TreeItemData[];
	onNavigate?: (id: string) => void;
}

export function TableOfContents({ contents, onNavigate }: TableOfContentsProps) {
	const [open, setOpen] = useState(false);
	const [showButton, setShowButton] = useState(false);
	const [searchKeyword, setSearchKeyword] = useState("");
	const normalButtonRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const tree = useTreeView({ items: contents, searchKeyword });

	const scrollToSection = useCallback((id: string) => {
		const element = document.getElementById(`heading-${id}`);
		if (element) {
			setTimeout(() => {
				element.scrollIntoView({ behavior: "smooth", block: "start" });
			}, 200);
		} else {
			console.info(`Element with id ${id} not found`);
		}
	}, []);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const isVisible = entries[0]?.isIntersecting ?? false;
				setShowButton(!isVisible);
			},
			{ threshold: 0 },
		);

		if (normalButtonRef.current) observer.observe(normalButtonRef.current);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		if (!window.location.hash) return;

		try {
			const decodedId = decodeURIComponent(window.location.hash.substring(1));
			onNavigate?.(decodedId);
			scrollToSection(decodedId);
		} catch {
			console.info("URLハッシュを読み込めませんでした");
		}
	}, [onNavigate, scrollToSection]);

	const handleOpenDialog = useCallback(() => {
		setOpen(true);
		setTimeout(() => searchInputRef.current?.focus(), 200);
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.ctrlKey && event.shiftKey && event.key.toUpperCase() === "O") {
				event.preventDefault();
				handleOpenDialog();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleOpenDialog]);

	const handleCloseDialog = useCallback(() => {
		setOpen(false);
		setSearchKeyword("");
		tree.setActiveId(null);
	}, [tree]);

	const handleItemClick = useCallback(
		(id: string) => {
			setOpen(false);
			setSearchKeyword("");
			tree.setActiveId(null);
			setTimeout(() => {
				window.history.pushState({}, "", `#${id}`);
				scrollToSection(id);
				onNavigate?.(id);
			}, 200);
		},
		[onNavigate, scrollToSection, tree],
	);

	const handleSearchChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const value = event.target.value;
			setSearchKeyword(value);
			if (!value.trim()) tree.setActiveId(null);
		},
		[tree],
	);

	const handleTreeKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLDivElement>) => {
			const activeId = tree.handleKeyDown(event);
			if (activeId) handleItemClick(activeId);
		},
		[handleItemClick, tree],
	);

	const handleSearchKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>) => {
			if (event.nativeEvent.isComposing) return;

			switch (event.key) {
				case "ArrowDown":
					event.preventDefault();
					tree.moveNext();
					break;
				case "ArrowUp":
					event.preventDefault();
					tree.movePrevious();
					break;
				case "Enter": {
					const activeId = tree.activateActive();
					if (activeId) {
						event.preventDefault();
						handleItemClick(activeId);
					}
					break;
				}
				case "Escape":
					if (searchKeyword === "") handleCloseDialog();
					else {
						event.preventDefault();
						setSearchKeyword("");
						tree.setActiveId(null);
					}
					break;
			}
		},
		[handleCloseDialog, handleItemClick, searchKeyword, tree],
	);

	const tocContent = useMemo(
		() => (
			<Box className="pb-1 w-full max-h-[80vh] overflow-y-auto">
				{tree.visibleItems.length > 0 ? (
					<TreeView
						items={contents}
						expandedIds={tree.expandedIds}
						activeId={tree.activeId}
						visibleItems={tree.visibleItems}
						searchKeyword={searchKeyword}
						onExpandedChange={tree.setExpandedIds}
						onActiveChange={tree.setActiveId}
						onActivate={handleItemClick}
						onKeyDown={handleTreeKeyDown}
					/>
				) : (
					<Box className="px-4 py-3 text-sm text-gray-500">該当する項目がありません</Box>
				)}
			</Box>
		),
		[contents, handleItemClick, handleTreeKeyDown, searchKeyword, tree],
	);

	const tocButton = useMemo(
		() => (
			<Button
				onClick={handleOpenDialog}
				startIcon={<MenuIcon />}
				className="
					bg-sky-100
					hover:bg-sky-200
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
		),
		[handleOpenDialog],
	);

	return (
		<>
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
				<Box className="fixed top-4 right-4 z-50">{tocButton}</Box>
			</Transition>

			<Box className="my-2" ref={normalButtonRef}>
				{tocButton}
			</Box>

			<Transition appear show={open} as={Fragment}>
				<Dialog as="div" className="relative z-50" onClose={handleCloseDialog}>
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
										<DialogTitle
											as="h3"
											className="text-lg font-bold leading-6 text-gray-900"
										>
											目次
										</DialogTitle>
										<button
											type="button"
											aria-label="目次を閉じる"
											onClick={handleCloseDialog}
											className="text-gray-500 hover:text-gray-700 focus:outline-none"
										>
											<CloseIcon />
										</button>
									</div>

									<Box className="mb-4">
										<TextField
											slotProps={{
												htmlInput: {
													ref: searchInputRef,
													role: "combobox",
													"aria-label": "目次を検索",
													"aria-controls": "toc-tree",
													"aria-haspopup": "tree",
													"aria-expanded": open,
													"aria-activedescendant": tree.activeId
														? getTreeItemDomId(tree.activeId)
														: undefined,
												},
												input: {
													startAdornment: (
														<InputAdornment position="start">
															<SearchIcon />
														</InputAdornment>
													),
													className: "rounded-lg",
												},
											}}
											fullWidth
											placeholder="目次を検索..."
											size="small"
											value={searchKeyword}
											onChange={handleSearchChange}
											onKeyDown={handleSearchKeyDown}
										/>
									</Box>

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

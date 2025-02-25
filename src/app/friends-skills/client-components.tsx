"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box, Paper, Pagination, Collapse } from "@mui/material";
import { SkillEffect } from "@/types/friendsSkills";
import { FriendsDataRow } from "@/types/friends";
import { SortableTable } from "@/components/table/SortableTable";
import { FriendsNameLink } from "@/components/friends/FriendsNameLink";
import { FriendsAttributeIconAndName } from "@/components/friends/FriendsAttributeIconAndName";
import { SectionHeading } from "@/components/section/SectionHeading";
import { TableOfContents } from "@/components/section/TableOfContents";
import Image from "next/image";
import { ColumnDef, Row, flexRender, SortingState, ColumnFiltersState } from "@tanstack/react-table";

// CSV内の「~~」を改行に変換する関数
function formatTextContent(text: string): React.ReactElement {
	const parts = text.split('~~');

	return (
		<>
			{parts.map((part, index) => (
				<span key={index}>
					{part}
					{index < parts.length - 1 && <br />}
				</span>
			))}
		</>
	);
}

// スキルとフレンズデータを含む結合型
type SkillWithFriend = SkillEffect & {
	friend?: FriendsDataRow
}

// スキルカテゴリーの階層構造を表す型
interface SkillCategory {
	name: string;
	id: string;
	children?: SkillCategory[];
}

export default function ClientTabs({
	effectTypes,
	skillsData
}: {
	effectTypes: string[],
	skillsData: SkillWithFriend[]
}) {
	// formatText関数をメモ化
	const formatText = useCallback((text: string): React.ReactElement => {
		return formatTextContent(text);
	}, []);

	// 効果種別ごとにデータをメモ化
	const effectTypeData = useMemo(() => {
		const result: Record<string, SkillWithFriend[]> = {};

		// 各効果種別ごとにデータをフィルタリング
		effectTypes.forEach(effectType => {
			result[effectType] = skillsData.filter(
				skill => skill.effectType === effectType
			);
		});

		return result;
	}, [effectTypes, skillsData]);

	// スキルカテゴリーの階層構造（静的に定義）
	const skillCategories: SkillCategory[] = useMemo(() => [
		{
			name: "バフ",
			id: "buff",
			children: [
				{
					name: "与ダメージ増加",
					id: "buff-damage-increase",
					children: [
						{ name: "与ダメージ増加", id: "与ダメージ増加" },
						{ name: "Beat!!!与ダメージ増加", id: "Beat!!!与ダメージ増加" },
						{ name: "Action!与ダメージ増加", id: "Action!与ダメージ増加" },
						{ name: "Try!!与ダメージ増加", id: "Try!!与ダメージ増加" },
					]
				},
				{
					name: "被ダメージ減少",
					id: "buff-damage-reduction",
					children: [
						{ name: "被ダメージ減少", id: "被ダメージ減少" },
						{ name: "全体攻撃による被ダメージ減少", id: "全体攻撃による被ダメージ減少" },
					]
				},
				{ name: "攻撃命中率増加", id: "攻撃命中率増加" },
				{ name: "かいひ増加", id: "かいひ増加" },
			]
		},
		{
			name: "デバフ",
			id: "debuff",
			children: [
				{ name: "与ダメージ減少", id: "与ダメージ減少" },
				{
					name: "被ダメージ増加",
					id: "debuff-damage-increase",
					children: [
						{ name: "被ダメージ増加", id: "被ダメージ増加" },
						{ name: "全体攻撃による被ダメージ増加", id: "全体攻撃による被ダメージ増加" },
					]
				},
				{ name: "攻撃命中率減少", id: "攻撃命中率減少" },
				{ name: "かいひ減少", id: "かいひ減少" },
			]
		},
		{
			name: "たいりょく回復",
			id: "hp-recovery",
			children: [
				{ name: "回復", id: "回復" },
				{ name: "毎ターン回復", id: "毎ターン回復" },
				{ name: "吸収", id: "吸収" },
				{ name: "毎ターン回復解除", id: "毎ターン回復解除" },
				{ name: "たいりょく回復量増加", id: "たいりょく回復量増加" },
				{ name: "たいりょく回復量減少", id: "たいりょく回復量減少" },
				{ name: "たいりょく回復量減少状態解除", id: "たいりょく回復量減少状態解除" },
			]
		},
		{
			name: "MP",
			id: "mp",
			children: [
				{ name: "MP増加", id: "MP増加" },
				{ name: "毎ターンMP増加", id: "毎ターンMP増加" },
				{ name: "MP減少", id: "MP減少" },
				{ name: "毎ターンMP減少状態解除", id: "毎ターンMP減少状態解除" },
				{ name: "MP増加量減少状態解除", id: "MP増加量減少状態解除" },
			]
		},
		{
			name: "バフ解除",
			id: "buff-removal",
			children: [
				{ name: "与ダメージ増加状態解除", id: "与ダメージ増加状態解除" },
				{ name: "被ダメージ減少状態解除", id: "被ダメージ減少状態解除" },
				{ name: "攻撃命中率増加状態解除", id: "攻撃命中率増加状態解除" },
				{ name: "かいひ増加状態解除", id: "かいひ増加状態解除" },
			]
		},
		{
			name: "デバフ解除",
			id: "debuff-removal",
			children: [
				{ name: "与ダメージ減少状態解除", id: "与ダメージ減少状態解除" },
				{ name: "被ダメージ増加状態解除", id: "被ダメージ増加状態解除" },
				{ name: "攻撃命中率減少状態解除", id: "攻撃命中率減少状態解除" },
				{ name: "かいひ減少状態解除", id: "かいひ減少状態解除" },
			]
		},
		{
			name: "その他",
			id: "others",
			children: [
				{ name: "プラズムチャージ効果回数追加", id: "プラズムチャージ効果回数追加" },
				{ name: "全体Beat", id: "全体Beat" },
				{ name: "均等割ダメージ", id: "均等割ダメージ" },
				{ name: "コーラス参加", id: "コーラス参加" },
				{ name: "おかわり増加", id: "おかわり増加" },
				{ name: "おかわり最大値増加", id: "おかわり最大値増加" },
				{ name: "たいりょく1で耐える", id: "たいりょく1で耐える" },
				{ name: "ギブアップ復帰", id: "ギブアップ復帰" },
			]
		},
	], []);

	const [selectedEffectType, setSelectedEffectType] = useState<string | null>(null);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 50
	});

	// セクションの開閉状態を管理
	const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

	// マウント時に全てのセクションを閉じる
	useEffect(() => {
		// 全てのセクションのIDを取得して閉じた状態にする
		const categoryIds = getAllCategoryIds(skillCategories);
		const initialOpenState: Record<string, boolean> = {};
		categoryIds.forEach(id => {
			initialOpenState[id] = false; // デフォルトで折りたたむ
		});
		setOpenSections(initialOpenState);
	}, [skillCategories]);

	// 再帰的に全てのカテゴリーIDを取得
	const getAllCategoryIds = (categories: SkillCategory[]): string[] => {
		let result: string[] = [];
		categories.forEach(category => {
			result.push(category.id);
			if (category.children && category.children.length > 0) {
				result = [...result, ...getAllCategoryIds(category.children)];
			}
		});
		return result;
	};

	// 効果種別を選択したときの処理
	const handleEffectTypeSelect = (effectType: string) => {
		setSelectedEffectType(effectType);
		// 選択時にソートとフィルターをリセット
		setSorting([]);
		setColumnFilters([]);
		setPagination({ pageIndex: 0, pageSize: 50 });

		// 該当セクションを開く
		setOpenSections(prev => ({
			...prev,
			[effectType]: true
		}));

		// スクロール処理
		setTimeout(() => {
			const element = document.getElementById(`section-${effectType}`);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth' });
			}
		}, 100);
	};

	// テーブルのカラム定義
	const columns = useMemo<ColumnDef<SkillWithFriend>[]>(() => [
		{
			accessorKey: 'friendsId',
			header: 'フレンズ',
			cell: ({ row }) => {
				const skill = row.original;
				if (!skill.friend) {
					return <div>{skill.friendsId}</div>;
				}

				return (
					<div className="flex items-center space-x-2">
						{skill.friend.iconUrl && (
							<div className="flex-shrink-0">
								<Image
									src={skill.friend.iconUrl}
									alt={skill.friend.name}
									width={40}
									height={40}
									className="rounded-sm"
								/>
							</div>
						)}
						<FriendsNameLink friend={skill.friend} />
					</div>
				);
			},
			meta: {
				width: '250px'
			}
		},
		{
			accessorKey: 'attribute',
			header: '属性',
			cell: ({ row }) => {
				const skill = row.original;
				if (!skill.friend || !skill.friend.attribute) {
					return null;
				}
				return (
					<FriendsAttributeIconAndName attribute={skill.friend.attribute} />
				);
			},
			meta: {
				width: '80px'
			}
		},
		{
			accessorKey: 'skillType',
			header: 'わざ種別',
			meta: {
				width: '120px'
			}
		},
		{
			accessorKey: 'power',
			header: '威力',
			cell: ({ row }) => {
				const power = row.original.power;
				if (!power) return null;

				// 数値に変換
				const powerNum = parseFloat(power);

				// 数値でない場合はそのまま表示
				if (isNaN(powerNum)) return power;

				// 1未満の場合は%表示
				if (powerNum < 1) {
					return `${(powerNum * 100).toFixed(0)}%`;
				}

				return power;
			},
			meta: {
				width: '100px'
			}
		},
		{
			accessorKey: 'target',
			header: '対象',
			cell: ({ row }) => {
				const text = row.original.target;
				if (!text) return null;
				return formatText(text);
			},
			meta: {
				width: '150px'
			}
		},
		{
			accessorKey: 'condition',
			header: '条件',
			cell: ({ row }) => {
				const text = row.original.condition;
				if (!text) return null;
				return formatText(text);
			},
			meta: {
				width: '200px'
			}
		},
		{
			accessorKey: 'effectTurn',
			header: '効果ターン',
			meta: {
				width: '100px'
			}
		},
		{
			accessorKey: 'activationRate',
			header: '発動率',
			cell: ({ row }) => {
				const rate = row.original.activationRate;
				if (!rate) return null;

				// 数値に変換
				const rateNum = parseFloat(rate);

				// 数値の場合は%表記
				if (!isNaN(rateNum)) {
					return `${rateNum}%`;
				}

				return rate;
			},
			meta: {
				width: '100px'
			}
		},
		{
			accessorKey: 'activationCount',
			header: '発動回数',
			meta: {
				width: '100px'
			}
		},
		{
			accessorKey: 'note',
			header: '備考',
			meta: {
				width: '200px'
			}
		},
	], [formatText]);

	// カスタム行コンポーネント
	const CustomRowComponent = useCallback(({ row }: { row: Row<SkillWithFriend> }) => (
		<tr
			key={row.id}
			className="hover:bg-gray-50"
		>
			{row.getVisibleCells().map(cell => (
				<td key={cell.id} className="p-2 border-b">
					{flexRender(cell.column.columnDef.cell, cell.getContext())}
				</td>
			))}
		</tr>
	), []);

	// セクションの開閉を切り替える
	const toggleSection = (effectType: string) => {
		setOpenSections(prev => ({
			...prev,
			[effectType]: !prev[effectType]
		}));
	};

	// 各カテゴリーのセクションをレンダリング
	const renderSkillSections = () => {
		// 親カテゴリーごとのセクションを作成
		const renderCategorySections = (categories: SkillCategory[], level = 0) => {
			return categories.map(category => {
				const hasChildren = category.children && category.children.length > 0;

				return (
					<Box key={category.id} sx={{ mt: level === 0 ? 4 : level === 1 ? 1 : 2, mb: level === 0 ? 2 : 0 }}>
						{/* カテゴリー見出し */}
						{level === 0 && (
							<Box id={`section-${category.id}`} sx={{ mb: 2 }}>
								<SectionHeading
									title={category.name}
									id={`heading-${category.id}`}
									isOpen={openSections[category.id] === true}
									onToggle={() => toggleSection(category.id)}
									level={1}
								/>
							</Box>
						)}

						{level === 1 && (
							<Box id={`section-${category.id}`}>
								<SectionHeading
									title={category.name}
									id={`heading-${category.id}`}
									isOpen={openSections[category.id] === true}
									onToggle={() => toggleSection(category.id)}
									level={2}
								/>
							</Box>
						)}

						{/* 子カテゴリーを再帰的にレンダリング */}
						{hasChildren && (
							<Box>
								{renderCategorySections(category.children || [], level + 1)}
							</Box>
						)}

						{/* リーフノード（実際のスキル効果）の場合はテーブルを表示 */}
						{!hasChildren && effectTypes.includes(category.id) && (
							<Box id={`section-${category.id}`}>
								{level >= 2 && (
									<SectionHeading
										title={category.name}
										id={`heading-${category.id}`}
										isOpen={openSections[category.id] === true}
										onToggle={() => toggleSection(category.id)}
										level={3}
										className="mt-1"
									/>
								)}

								<Collapse in={openSections[category.id] === true}>
									{renderSkillTable(category.id)}
								</Collapse>
							</Box>
						)}
					</Box>
				);
			});
		};

		return renderCategorySections(skillCategories);
	};

	// スキル効果のテーブルをレンダリング
	const renderSkillTable = (effectType: string) => {
		const data = effectTypeData[effectType] || [];
		if (data.length === 0) return null;

		// 現在のページに表示するデータ
		const isActive = selectedEffectType === effectType;
		const currentPagination = isActive ? pagination : { pageIndex: 0, pageSize: 50 };
		const pageCount = Math.ceil(data.length / currentPagination.pageSize);

		// ページネーション用のハンドラー
		const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
			if (isActive) {
				setPagination({
					...pagination,
					pageIndex: page - 1
				});
			}
		};

		return (
			<>
				<Paper className="mb-4 overflow-auto">
					<SortableTable
						data={data}
						columns={columns}
						state={{
							sorting: isActive ? sorting : [],
							columnFilters: isActive ? columnFilters : [],
							pagination: currentPagination
						}}
						onSortingChange={isActive ?
							(val) => setSorting(val) :
							() => {}
						}
						onColumnFiltersChange={isActive ?
							(val) => setColumnFilters(val) :
							() => {}
						}
						onPaginationChange={isActive ?
							(val) => setPagination(val) :
							() => {}
						}
						rowComponent={CustomRowComponent}
					/>
				</Paper>

				{/* ページネーション */}
				{pageCount > 1 && (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 4 }}>
						<Pagination
							count={pageCount}
							page={currentPagination.pageIndex + 1}
							onChange={handlePageChange}
							color="primary"
							showFirstButton
							showLastButton
						/>
					</Box>
				)}
			</>
		);
	};

	return (
		<>
			{/* 上部の目次 */}
			<TableOfContents
				categories={skillCategories}
				selectedId={selectedEffectType}
				onSelect={handleEffectTypeSelect}
			/>

			{/* メインコンテンツ */}
			<Box>
				{renderSkillSections()}
			</Box>
		</>
	);
}
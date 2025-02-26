"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box, Paper } from "@mui/material";
import { SkillEffect } from "@/types/friendsSkills";
import { FriendsDataRow } from "@/types/friends";
import { SortableTable } from "@/components/table/SortableTable";
import { FriendsNameLink } from "@/components/friends/FriendsNameLink";
import { FriendsAttributeIconAndName } from "@/components/friends/FriendsAttributeIconAndName";
import { TableOfContents } from "@/components/section/TableOfContents";
import { Heading } from "@/components/section/Heading";
import { FoldingSection } from "@/components/section/FoldingSection";
import { SeesaaWikiImage } from "@/components/SeesaaWikiImage";
import {
	ColumnDef,
	Row,
	flexRender,
	SortingState,
	ColumnFiltersState,
	useReactTable,
	getCoreRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	PaginationState
} from "@tanstack/react-table";
import { TablePagination } from "@/components/table/TablePagination";
import { toPercent } from "@/utils/common";

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

// 各スキルタイプのテーブルを管理する独立したコンポーネント
const SkillTypeTable = React.memo(({
	data,
	columns,
	effectType,
}: {
	data: SkillWithFriend[];
	columns: ColumnDef<SkillWithFriend, unknown>[];
	effectType: string;
}) => {
	// 各テーブル独自の状態を管理
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 });

	// 初期化時にlocalStorageから値を読み込む
	useEffect(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem(`wiki-nanodesu.friends-skills.pagination.${effectType}`);
			if (saved) {
				setPagination(JSON.parse(saved));
			}
		}
	}, [effectType]);

	// ローカルストレージへの保存
	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem(`wiki-nanodesu.friends-skills.pagination.${effectType}`, JSON.stringify(pagination));
		}
	}, [pagination, effectType]);

	// カスタム行コンポーネント
	const CustomRowComponent = useCallback(({ row }: { row: Row<SkillWithFriend> }) => (
		<tr
			key={row.id}
			className="hover:bg-gray-50"
		>
			{row.getVisibleCells().map(cell => {
				return (
					<td
						key={cell.id}
						className={`p-2 border-b text-sm`}
					>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</td>
				);
			})}
		</tr>
	), []);

	// テーブルインスタンスを作成
	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnFilters,
			pagination
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		manualPagination: false,
		debugTable: false,
	});

	const pageCount = table.getPageCount();

	return (
		<>
			{pageCount > 1 && (
				<TablePagination table={table} />
			)}

			<SortableTable
				data={data}
				columns={columns}
				state={{
					sorting,
					columnFilters,
					pagination
				}}
				onSortingChange={setSorting}
				onColumnFiltersChange={setColumnFilters}
				onPaginationChange={setPagination}
				rowComponent={CustomRowComponent}
			/>
		</>
	);
});

SkillTypeTable.displayName = "SkillTypeTable";

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
					<div className="text-sm flex items-center space-x-2">
						{skill.friend.iconUrl && (
							<div className="flex-shrink-0">
								<SeesaaWikiImage
									src={skill.friend.iconUrl}
									alt={skill.friend.name}
									width={45}
									height={45}
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
			},
		},
		{
			accessorFn: (row) => {
				const power = row.power;
				if (!power) return -Infinity;
				const powerNum = parseFloat(power);
				return isNaN(powerNum) ? power : powerNum;
			},
			id: 'power',
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
					return toPercent(powerNum, 0);
				}

				return power;
			},
			sortingFn: (rowA, rowB, columnId) => {
				const valueA = rowA.getValue(columnId);
				const valueB = rowB.getValue(columnId);

				// どちらかがnullやundefinedの場合
				if (valueA == null) return 1;
				if (valueB == null) return -1;

				// 両方とも数値の場合は数値比較
				if (typeof valueA === 'number' && typeof valueB === 'number') {
					return valueA - valueB;
				}

				// 文字列の場合は文字列比較
				return String(valueA).localeCompare(String(valueB));
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
			accessorFn: (row) => {
				const rate = row.activationRate;
				if (!rate) return -Infinity;
				const rateNum = parseFloat(rate);
				return isNaN(rateNum) ? rate : rateNum;
			},
			id: 'activationRate',
			header: '発動率',
			cell: ({ row }) => {
				const rate = row.original.activationRate;
				if (!rate) return null;

				// 数値に変換
				const rateNum = parseFloat(rate);

				// 数値の場合は%表記
				if (!isNaN(rateNum)) {
					return toPercent(rateNum, 0);
				}

				return rate;
			},
			sortingFn: (rowA, rowB, columnId) => {
				const valueA = rowA.getValue(columnId);
				const valueB = rowB.getValue(columnId);

				// どちらかがnullやundefinedの場合
				if (valueA == null) return 1;
				if (valueB == null) return -1;

				// 両方とも数値の場合は数値比較
				if (typeof valueA === 'number' && typeof valueB === 'number') {
					return valueA - valueB;
				}

				// 文字列の場合は文字列比較
				return String(valueA).localeCompare(String(valueB));
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

	// 効果種別を選択したときの処理
	const handleEffectTypeSelect = (effectType: string) => {
		// スクロール処理
		setTimeout(() => {
			const element = document.getElementById(`section-${effectType}`);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth' });
			}
		}, 100);
	};

	const renderSkillSections = () => {
		// 親カテゴリーごとのセクションを作成
		const renderCategorySections = (categories: SkillCategory[], level = 0) => {
			return categories.map(category => {
				const hasChildren = category.children && category.children.length > 0;
				const isLeafNode = !hasChildren && effectTypes.includes(category.id);

				return (
					<Box key={category.id} className={`
						${level === 0 ? 'mt-4' : level === 1 ? 'mt-1' : 'mt-2'}
						${level === 0 ? 'mb-2' : 'mb-0'}
					`}>
						{/* レベル0の見出し (トップレベル) */}
						{level === 0 && (
							<Box id={`section-${category.id}`} className="mb-2">
								<Heading
									title={category.name}
									id={`heading-${category.id}`}
									level={1}
								/>
								<FoldingSection
									isOpenByDefault={true}
									sectionId={`friends-skills.skill-${category.id}`}
								>
									{hasChildren && (
										<Box>
											{renderCategorySections(category.children || [], level + 1)}
										</Box>
									)}
									{isLeafNode && renderSkillTable(category.id)}
								</FoldingSection>
							</Box>
						)}

						{/* レベル1の見出し */}
						{level === 1 && (
							<Box id={`section-${category.id}`}>
								<Heading
									title={category.name}
									id={`heading-${category.id}`}
									level={2}
								/>
								<FoldingSection
									isOpenByDefault={true}
									sectionId={`friends-skills.skill-${category.id}`}
								>
									{hasChildren && (
										<Box>
											{renderCategorySections(category.children || [], level + 1)}
										</Box>
									)}
									{isLeafNode && renderSkillTable(category.id)}
								</FoldingSection>
							</Box>
						)}

						{/* レベル2以上の見出し */}
						{level >= 2 && isLeafNode && (
							<Box id={`section-${category.id}`}>
								<Heading
									title={category.name}
									id={`heading-${category.id}`}
									level={3}
									className="mt-1"
								/>
								<FoldingSection
									isOpenByDefault={true}
									sectionId={`friends-skills.skill-${category.id}`}
								>
									{renderSkillTable(category.id)}
								</FoldingSection>
							</Box>
						)}
					</Box>
				);
			});
		};

		return renderCategorySections(skillCategories);
	};

	const renderSkillTable = (effectType: string) => {
		const data = effectTypeData[effectType] || [];
		if (data.length === 0) return null;

		return (
			<Paper className="mb-4 overflow-auto">
				<SkillTypeTable
					data={data}
					columns={columns}
					effectType={effectType}
				/>
			</Paper>
		);
	};

	return (
		<>
			<TableOfContents
				categories={skillCategories}
				onSelect={handleEffectTypeSelect}
				sectionId="friends-skills.tableOfContents"
			/>

			<Box>
				{renderSkillSections()}
			</Box>
		</>
	);
}
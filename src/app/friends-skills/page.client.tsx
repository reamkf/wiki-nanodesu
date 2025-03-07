"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { SkillWithFriend } from "@/types/friendsSkills";
import { SortableTable } from "@/components/table/SortableTable";
import { FriendsNameLink } from "@/components/friends/FriendsNameLink";
import { FriendsAttributeIconAndName } from "@/components/friends/FriendsAttributeIconAndName";
import { TableOfContents, TableOfContentsData } from "@/components/section/TableOfContents";
import { Heading } from "@/components/section/Heading";
import { FoldingSection } from "@/components/section/FoldingSection";
import { SeesaaWikiImage } from "@/components/seesaawiki/SeesaaWikiImage";
import { FriendsAttribute } from "@/types/friends";
import { parseSeesaaWikiNewLine } from "@/utils/seesaaWiki";
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
import { includesNormalizeQuery } from "@/utils/queryNormalizer";
import { sortFriendsAttribute } from "@/utils/friends";
import { isNumber } from "@/utils/common";

const ClientOnlyInitializer = ({
	children,
	onInitialized,
}: {
	children: React.ReactNode;
	onInitialized: () => void;
}) => {
	useEffect(() => {
		onInitialized();
	}, [onInitialized]);

	return <>{children}</>;
};

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
	const [isMounted, setIsMounted] = useState(false);

	// 初期化ハンドラー
	const handleInitialized = useCallback(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem(`wiki-nanodesu.friends-skills.pagination.${effectType}`);
			if (saved) {
				setPagination(JSON.parse(saved));
			}
			setIsMounted(true);
		}
	}, [effectType]);

	// ローカルストレージへの保存
	useEffect(() => {
		if (typeof window !== "undefined" && isMounted) {
			localStorage.setItem(`wiki-nanodesu.friends-skills.pagination.${effectType}`, JSON.stringify(pagination));
		}
	}, [pagination, effectType, isMounted]);

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
		enableSorting: true,
		enableFilters: true,
		enableColumnFilters: true,
		manualSorting: false,
		manualFiltering: false,
		manualPagination: false,
		debugTable: false,
	});

	const pageCount = table.getPageCount();

	if (!isMounted) {
		return (
			<ClientOnlyInitializer onInitialized={handleInitialized}>
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
			</ClientOnlyInitializer>
		);
	}

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

const getSearchableText = (
	row: SkillWithFriend,
	columnId: string
): string => {
	switch (columnId) {
		case "name":
		case "icon":
			return row.friendsDataRow.secondName
				? `${row.friendsDataRow.secondName} ${row.friendsDataRow.name}`
				: row.friendsDataRow.name;
		case "attribute":
			return row.friendsDataRow.attribute;
		default:
			return (
				row[columnId as keyof SkillWithFriend].toString() ?? ""
			);
	}
};

const customFilterFn = (row: Row<SkillWithFriend>, columnId: string, filterValue: string) => {
	const value = getSearchableText(row.original, columnId);
	return includesNormalizeQuery(value, filterValue);
};

SkillTypeTable.displayName = "SkillTypeTable";

export default function ClientTabs({
	effectTypes,
	effectTypeData,
	skillCategories
}: {
	effectTypes: string[],
	effectTypeData: Record<string, SkillWithFriend[]>,
	skillCategories: TableOfContentsData[]
}) {
	const [isMounted, setIsMounted] = useState(false);
	const [selectedEffectType, setSelectedEffectType] = useState<string | null>(null);

	// クライアントサイドでのみ実行される初期化処理
	const handleInitialized = useCallback(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("wiki-nanodesu.friends-skills.selectedEffectType");
			if (saved) {
				setSelectedEffectType(JSON.parse(saved));
			} else if (effectTypes.length > 0) {
				setSelectedEffectType(effectTypes[0]);
			}
			setIsMounted(true);
		}
	}, [effectTypes]);

	// 選択されたエフェクトタイプの保存
	useEffect(() => {
		if (typeof window !== "undefined" && isMounted && selectedEffectType) {
			localStorage.setItem("wiki-nanodesu.friends-skills.selectedEffectType", JSON.stringify(selectedEffectType));
		}
	}, [selectedEffectType, isMounted]);

	// formatText関数をメモ化
	const formatText = useCallback((text: string): React.ReactElement => {
		return parseSeesaaWikiNewLine(text);
	}, []);

	// テーブルのカラム定義
	const columns = useMemo<ColumnDef<SkillWithFriend>[]>(() => [
		{
			accessorKey: 'friendsId',
			header: 'フレンズ',
			cell: ({ row }) => {
				const skill = row.original;
				if (!skill.friendsDataRow) {
					return <div>{skill.friendsId}</div>;
				}

				return (
					<div className="text-sm flex items-center space-x-2">
						{skill.friendsDataRow.iconUrl && (
							<div className="flex-shrink-0">
								<SeesaaWikiImage
									src={skill.friendsDataRow.iconUrl}
									alt={skill.friendsDataRow.name}
									width={45}
									height={45}
									className="rounded-sm"
								/>
							</div>
						)}
						<FriendsNameLink friend={skill.friendsDataRow} />
					</div>
				);
			},
			filterFn: customFilterFn,
			meta: {
				width: '250px'
			}
		},
		{
			accessorFn: (row) => row.friendsDataRow?.attribute || '',
			id: 'attribute',
			header: '属性',
			cell: ({ row }) => {
				const skill = row.original;
				if (!skill.friendsDataRow || !skill.friendsDataRow.attribute) {
					return null;
				}
				return (
					<FriendsAttributeIconAndName attribute={skill.friendsDataRow.attribute} />
				);
			},
			filterFn: customFilterFn,
			sortingFn: (rowA, rowB, columnId) => {
				const attributeA = rowA.getValue(columnId) as FriendsAttribute;
				const attributeB = rowB.getValue(columnId) as FriendsAttribute;
				return sortFriendsAttribute(attributeA, attributeB);
			},
			meta: {
				width: '80px'
			}
		},
		{
			accessorKey: 'skillType',
			header: 'わざ種別',
			cell: ({ row }) => {
				const text = row.original.skillType;
				if (!text) return null;
				return formatText(text);
			},
			filterFn: customFilterFn,
			meta: {
				width: '120px'
			},
		},
		{
			accessorFn: (row) => {
				const power = row.power;
				if (!power) return -Infinity;
				return isNumber(power) ? parseFloat(power) : power;
			},
			id: 'power',
			header: '威力',
			cell: ({ row }) => {
				const power = row.original.power;
				if (!power) return null;

				// 数値に変換
				const powerNum = parseFloat(power);

				// 数値でない場合はそのまま表示
				if (!isNumber(power)) return formatText(power);

				// MP関連のスキルかどうかを判断
				const intFormatEffectTypes = [
					'MP増加', 'MP減少', '毎ターンMP増加', '毎ターンMP減少',
					'プラズムチャージ効果回数追加'
				];
				const isPercentFormat = !intFormatEffectTypes.some(effectType => row.original.effectType?.includes(effectType));

				if (isPercentFormat) {
					return toPercent(powerNum);
				} else {
					return powerNum.toString();
				}
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
			filterFn: customFilterFn,
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
			filterFn: customFilterFn,
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
			filterFn: customFilterFn,
			meta: {
				width: '200px'
			}
		},
		{
			accessorKey: 'effectTurn',
			header: '効果ターン',
			cell: ({ row }) => {
				const text = row.original.effectTurn;
				if (!text) return null;
				return formatText(text);
			},
			filterFn: customFilterFn,
			meta: {
				width: '100px'
			}
		},
		{
			accessorFn: (row) => {
				const rate = row.activationRate;
				if (!rate) return -Infinity;
				const rateNum = parseFloat(rate);
				return isNumber(rate) ? rateNum : rate;
			},
			id: 'activationRate',
			header: '発動率',
			cell: ({ row }) => {
				const rate = row.original.activationRate;
				if (!rate) return null;

				// 数値に変換
				const rateNum = parseFloat(rate);

				// 数値の場合は%表記
				if (isNumber(rate)) {
					return toPercent(rateNum, 0);
				}

				return formatText(rate);
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
			filterFn: customFilterFn,
			meta: {
				width: '100px'
			}
		},
		{
			accessorKey: 'activationCount',
			header: '発動回数',
			cell: ({ row }) => {
				const text = row.original.activationCount;
				if (!text) return null;
				return formatText(text);
			},
			filterFn: customFilterFn,
			meta: {
				width: '100px'
			}
		},
		{
			accessorKey: 'note',
			header: '備考',
			cell: ({ row }) => {
				const text = row.original.note;
				if (!text) return null;
				return formatText(text);
			},
			filterFn: customFilterFn,
			meta: {
				width: '200px'
			}
		},
	], [formatText]);

	// 効果種別を選択したときの処理
	const handleEffectTypeSelect = (effectType: string) => {
		setSelectedEffectType(effectType);

		// スクロール処理
		if (isMounted) {
			setTimeout(() => {
				const element = document.getElementById(`section-${effectType}`);
				if (element) {
					element.scrollIntoView({ behavior: 'smooth' });
				}
			}, 100);
		}
	};

	const renderSkillSections = () => {
		// 親カテゴリーごとのセクションを作成
		const renderCategorySections = (categories: TableOfContentsData[], level = 0) => {
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
									isOpenByDefault={!isLeafNode}
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
									isOpenByDefault={!isLeafNode}
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
									isOpenByDefault={!isLeafNode}
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
			<SkillTypeTable
				data={data}
				columns={columns}
				effectType={effectType}
			/>
		);
	};

	if (!isMounted) {
		return (
			<ClientOnlyInitializer onInitialized={handleInitialized}>
				<>
					<TableOfContents
						contents={skillCategories}
						onSelect={handleEffectTypeSelect}
						sectionId="friends-skills.tableOfContents"
					/>
					<Box className="mt-4">
						{renderSkillSections()}
					</Box>
				</>
			</ClientOnlyInitializer>
		);
	}

	return (
		<>
			<TableOfContents
				contents={skillCategories}
				onSelect={handleEffectTypeSelect}
				sectionId="friends-skills.tableOfContents"
			/>
			<Box className="mt-4">
				{renderSkillSections()}
			</Box>
		</>
	);
}
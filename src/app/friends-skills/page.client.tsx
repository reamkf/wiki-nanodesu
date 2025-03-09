"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { SkillWithFriend } from "@/types/friendsSkills";
import { FriendsNameLink } from "@/components/friends/FriendsNameLink";
import { FriendsAttributeIconAndName } from "@/components/friends/FriendsAttributeIconAndName";
import { TableOfContentsData } from "@/components/section/TableOfContents";
import { SeesaaWikiImage } from "@/components/seesaawiki/SeesaaWikiImage";
import { parseSeesaaWikiNewLine } from "@/utils/seesaaWiki";
import { ColumnDef } from "@tanstack/react-table";
import { toPercent, isNumber } from "@/utils/common";
import { sortFriendsAttribute } from "@/utils/friends";
import { FilterableDataTable, createCustomFilterFn } from "@/components/table/FilterableDataTable";
import { CategoryLayout } from "@/components/section/CategoryLayout";
import { FriendsAttribute } from "@/types/friends";

// FilterableDataTableで使用する型付きのラッパーコンポーネント
const SkillTable = ({ data, columns, tableId }: {
	data: SkillWithFriend[];
	columns: ColumnDef<SkillWithFriend, unknown>[];
	tableId: string;
}) => {
	return (
		<FilterableDataTable
			data={data}
			columns={columns as ColumnDef<Record<string, unknown>, unknown>[]}
			tableId={tableId}
		/>
	);
};

export default function ClientTabs({
	effectTypes,
	effectTypeData,
	skillCategories
}: {
	effectTypes: string[],
	effectTypeData: Record<string, SkillWithFriend[]>,
	skillCategories: TableOfContentsData[]
}) {
	// 選択されたエフェクトタイプの状態を管理
	const [selectedEffectType, setSelectedEffectType] = useState<string | null>(null);

	// 初期選択として最初のエフェクトタイプを設定
	useEffect(() => {
		if (effectTypes.length > 0 && !selectedEffectType) {
			setSelectedEffectType(effectTypes[0]);
		}
	}, [effectTypes, selectedEffectType]);

	// formatText関数をメモ化
	const formatText = useCallback((text: string): React.ReactElement => {
		return parseSeesaaWikiNewLine(text);
	}, []);

	// 検索可能なテキストを取得する関数
	const getSearchableText = useCallback((row: SkillWithFriend, columnId: string): string => {
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
					row[columnId as keyof SkillWithFriend]?.toString() ?? ""
				);
		}
	}, []);

	// カスタムフィルター関数の作成
	const customFilterFn = useMemo(() => createCustomFilterFn(getSearchableText), [getSearchableText]);

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
							<div className="shrink-0">
								<SeesaaWikiImage
									src={skill.friendsDataRow.iconUrl}
									alt={skill.friendsDataRow.name}
									width={45}
									height={45}
									className="rounded-xs"
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
				width: '120px'
			}
		},
		{
			accessorKey: 'activationRate',
			header: '発動率',
			cell: ({ row }) => {
				const text = row.original.activationRate;
				if (!text) return null;
				return formatText(text);
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
		},
	], [formatText, customFilterFn]);

	// カテゴリIDに基づいてコンテンツをレンダリングする関数
	const renderContent = useCallback((categoryId: string) => {
		// カテゴリIDがeffectTypeDataに存在するか確認
		if (effectTypeData[categoryId]) {
			const data = effectTypeData[categoryId];
			if (data.length === 0) return null;

			return (
				<SkillTable
					data={data}
					columns={columns}
					tableId={`friends-skills-${categoryId}`}
				/>
			);
		}

		return null;
	}, [columns, effectTypeData]);

	// カテゴリーが選択されたときの処理
	const handleSelectCategory = useCallback((id: string) => {
		if (effectTypeData[id]) {
			setSelectedEffectType(id);
		}
	}, [effectTypeData]);

	return (
		<CategoryLayout
			categories={skillCategories}
			renderContent={renderContent}
			onSelectCategory={handleSelectCategory}
			selectedCategory={selectedEffectType}
			emptyMessage="データがありません"
		/>
	);
}
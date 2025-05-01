"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { SkillWithFriend } from "@/types/friendsSkills";
import { FriendsAttributeIconAndName } from "@/components/friends/FriendsAttributeIconAndName";
import { TreeItemData } from "@/components/common/TreeList";
import { ColumnDef } from "@tanstack/react-table";
import { toPercent, isNumber } from "@/utils/common";
import { sortAttribute } from "@/utils/friends/friends";
import { createCustomFilterFn } from "@/utils/tableFilters";
import { CategoryLayout } from "@/components/section/CategoryLayout";
import { FriendsAttribute } from "@/types/friends";
import {
	formatText,
	FriendOrPhotoDisplay,
	TextCell,
	getSearchableTextForFriendOrPhoto
} from "@/components/table/GenericDataTable";
import { Table } from "@/components/table/Table";
import { getActivationRatePriority } from "@/types/abnormalStatus";

export default function ClientTabs({
	effectTypes,
	effectTypeData,
	skillCategories
}: {
	effectTypes: string[],
	effectTypeData: Record<string, SkillWithFriend[]>,
	skillCategories: TreeItemData[]
}) {
	// 選択されたエフェクトタイプの状態を管理
	const [selectedEffectType, setSelectedEffectType] = useState<string | null>(null);

	// 初期選択として最初のエフェクトタイプを設定
	useEffect(() => {
		if (effectTypes.length > 0 && !selectedEffectType) {
			setSelectedEffectType(effectTypes[0]);
		}
	}, [effectTypes, selectedEffectType]);

	// 検索可能なテキストを取得する関数
	const getSearchableText = useCallback((row: SkillWithFriend, columnId: string): string => {
		return getSearchableTextForFriendOrPhoto(row, columnId);
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

				return <FriendOrPhotoDisplay data={skill} />;
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
				return sortAttribute(attributeA, attributeB);
			},
			meta: {
				width: '80px'
			}
		},
		{
			accessorKey: 'skillType',
			header: 'わざ種別',
			cell: ({ row }) => <TextCell text={row.original.skillType} />,
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
				width: '100px',
				align: 'center' as const,
			}
		},
		{
			accessorKey: 'target',
			header: '対象',
			cell: ({ row }) => <TextCell text={row.original.target} />,
			filterFn: customFilterFn,
			meta: {
				width: '150px',
				align: 'center' as const,
			}
		},
		{
			accessorKey: 'condition',
			header: '条件',
			cell: ({ row }) => <TextCell text={row.original.condition} />,
			filterFn: customFilterFn,
			meta: {
				width: '200px',
				align: 'center' as const,
			}
		},
		{
			accessorKey: 'effectTurn',
			header: '効果ターン',
			cell: ({ row }) => <TextCell text={row.original.effectTurn} />,
			filterFn: customFilterFn,
			meta: {
				width: '120px',
				align: 'center' as const,
			}
		},

		{
			accessorFn: (row) => {
				const activationRate = row.activationRate;
				if (!activationRate) return -Infinity;
				return isNumber(activationRate) ? toPercent(parseFloat(activationRate)) : activationRate;
			},
			id: 'activationRate',
			header: '発動率',
			cell: ({ row }) => {
				const activationRate = row.original.activationRate;
				if (!activationRate) return null;

				// 数値に変換
				const activationRateNum = parseFloat(activationRate);

				// 数値でない場合はそのまま表示
				if (!isNumber(activationRate)) return formatText(activationRate);

				return toPercent(activationRateNum);
			},
			filterFn: customFilterFn,
			sortingFn: (rowA, rowB) => {
				const rateA = rowA.original.activationRate;
				const rateB = rowB.original.activationRate;

				const priorityA = getActivationRatePriority(rateA);
				const priorityB = getActivationRatePriority(rateB);

				// 優先度が高いほうが上に来るように降順でソート
				return priorityA - priorityB;
			},
			meta: {
				width: '100px',
				align: 'center' as const,
			}
		},
		{
			accessorKey: 'activationCount',
			header: '発動回数',
			cell: ({ row }) => <TextCell text={row.original.activationCount} />,
			filterFn: customFilterFn,
			meta: {
				width: '100px',
				align: 'center' as const,
			}
		},
		{
			accessorKey: 'note',
			header: '備考',
			cell: ({ row }) => <TextCell text={row.original.note} />,
			filterFn: customFilterFn,
		},
	], [customFilterFn]);

	// カテゴリIDに基づいてコンテンツをレンダリングする関数
	const renderContent = useCallback((categoryId: string) => {
		// カテゴリIDがeffectTypeDataに存在するか確認
		if (effectTypeData[categoryId]) {
			const data = effectTypeData[categoryId];
			if (data.length === 0) return null;

			return (
				<Table
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
			onItemClisk={handleSelectCategory}
			selectedCategory={selectedEffectType}
			emptyMessage="データがありません"
		/>
	);
}
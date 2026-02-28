"use client";

import React, { useMemo, useCallback, useState } from "react";
import { SkillWithFriend } from "@/types/friendsSkills";
import { TreeItemData } from "@/components/common/TreeList";
import { ColumnDef } from "@tanstack/react-table";
import { isNumber } from "@/utils/common";
import { sortAttribute } from "@/utils/friends/friends";
import { createCustomFilterFn } from "@/utils/tableFilters";
import { CategoryLayout } from "@/components/section/CategoryLayout";
import { FriendsAttribute } from "@/types/friends";
import {
	FriendOrPhotoDisplay,
	TextCell,
	getSearchableTextForFriendOrPhoto
} from "@/components/table/GenericDataTable";
import { Table } from "@/components/table/Table";
import { getActivationRatePriority, getPowerPriority, getTargetPriority, getActivationCountPriority } from "@/utils/sortPriorities";
import { CommonPowerCell, AttributeCell, ActivationRateCell } from "@/components/table/cells";

// フレンズセル
const FriendCell = ({ data }: { data: SkillWithFriend }) => {
	if (!data.friendsDataRow) {
		return <div>{data.friendsId}</div>;
	}
	return <FriendOrPhotoDisplay data={data} />;
};

export default function ClientTabs({
	effectTypes,
	effectTypeData,
	skillCategories
}: {
	effectTypes: string[],
	effectTypeData: Record<string, SkillWithFriend[]>,
	skillCategories: TreeItemData[]
}) {
	const [selectedEffectType, setSelectedEffectType] = useState<string | null>(null);

	const customFilterFn = useMemo(() => createCustomFilterFn<SkillWithFriend>(getSearchableTextForFriendOrPhoto), []);

	// テーブルのカラム定義
	const columns = useMemo<ColumnDef<SkillWithFriend>[]>(() => [
		{
			accessorKey: 'friendsId',
			header: 'フレンズ',
			cell: ({ row }) => <FriendCell data={row.original} />,
			filterFn: customFilterFn,
			meta: {
				width: '250px'
			}
		},
		{
			accessorFn: (row) => row.friendsDataRow?.attribute || '',
			id: 'attribute',
			header: '属性',
			cell: ({ row }) => <AttributeCell data={row.original} />,
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
				return isNumber(power) ? parseFloat(power) : getPowerPriority(power);
			},
			id: 'power',
			header: '威力',
			cell: ({ row }) => <CommonPowerCell data={row.original} />,
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
			sortingFn: (rowA, rowB, columnId) => {
				const targetA = rowA.getValue(columnId) as string;
				const targetB = rowB.getValue(columnId) as string;
				return getTargetPriority(targetA) - getTargetPriority(targetB);
			},
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
				return isNumber(activationRate) ? parseFloat(activationRate) : getActivationRatePriority(activationRate);
			},
			id: 'activationRate',
			header: '発動率',
			cell: ({ row }) => <ActivationRateCell data={row.original} />,
			filterFn: customFilterFn,
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
			sortingFn: (rowA, rowB, columnId) => {
				const countA = rowA.getValue(columnId) as string | number;
				const countB = rowB.getValue(columnId) as string | number;
				return getActivationCountPriority(countA) - getActivationCountPriority(countB);
			},
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
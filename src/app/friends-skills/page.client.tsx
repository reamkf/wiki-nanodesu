"use client";

import React, { useMemo, useCallback, useState } from "react";
import { SkillWithFriend } from "@/types/friendsSkills";
import { TreeItemData } from "@/components/common/TreeList";
import { isNumber } from "@/utils/common";
import { isFriendsAttribute, sortAttribute } from "@/utils/friends/friends";
import { createCustomFilterFn } from "@/utils/tableFilters";
import { CategoryLayout } from "@/components/section/CategoryLayout";
import { FriendsAttribute } from "@/types/friends";
import {
	FriendOrPhotoDisplay,
	TextCell,
	getSearchableTextForFriendOrPhoto,
} from "@/components/table/GenericDataTable";
import { Table, WikiTableColumnDef } from "@/components/table/Table";
import {
	getActivationRatePriority,
	getPowerPriority,
	getTargetPriority,
	getActivationCountPriority,
} from "@/utils/sortPriorities";
import { CommonPowerCell, AttributeCell, ActivationRateCell } from "@/components/table/cells";

function getFriendsAttribute(value: unknown): FriendsAttribute {
	return isFriendsAttribute(value) ? value : FriendsAttribute.none;
}

function getStringValue(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function getStringOrNumberValue(value: unknown): string | number {
	return typeof value === "string" || typeof value === "number" ? value : "";
}

// フレンズセル
const FriendCell = ({ data }: { data: SkillWithFriend }) => {
	if (!data.friendsDataRow) {
		return <div>{data.friendsId}</div>;
	}
	return <FriendOrPhotoDisplay data={data} />;
};

export default function ClientTabs({
	effectTypeData,
	skillCategories,
}: {
	effectTypeData: Record<string, SkillWithFriend[]>;
	skillCategories: TreeItemData[];
}) {
	const [selectedEffectType, setSelectedEffectType] = useState<string | null>(null);

	const customFilterFn = useMemo(
		() => createCustomFilterFn<SkillWithFriend>(getSearchableTextForFriendOrPhoto),
		[],
	);

	// テーブルのカラム定義
	const columns = useMemo<WikiTableColumnDef<SkillWithFriend>[]>(
		() => [
			{
				accessorKey: "friendsId",
				header: "フレンズ",
				cell: ({ row }) => <FriendCell data={row.original} />,
				filterFn: customFilterFn,
				meta: {
					width: "250px",
				},
			},
			{
				accessorFn: (row) => row.friendsDataRow?.attribute || "",
				id: "attribute",
				header: "属性",
				cell: ({ row }) => <AttributeCell data={row.original} />,
				filterFn: customFilterFn,
				sortFn: (rowA, rowB, columnId) => {
					const attributeA = getFriendsAttribute(rowA.getValue(columnId));
					const attributeB = getFriendsAttribute(rowB.getValue(columnId));
					return sortAttribute(attributeA, attributeB);
				},
				meta: {
					width: "80px",
				},
			},
			{
				accessorKey: "skillType",
				header: "わざ種別",
				cell: ({ row }) => <TextCell text={row.original.skillType} />,
				filterFn: customFilterFn,
				meta: {
					width: "120px",
				},
			},
			{
				accessorFn: (row) => {
					const power = row.power;
					if (!power) return -Infinity;
					return isNumber(power) ? parseFloat(power) : getPowerPriority(power);
				},
				id: "power",
				header: "威力",
				cell: ({ row }) => <CommonPowerCell data={row.original} />,
				filterFn: customFilterFn,
				meta: {
					width: "100px",
					align: "center" as const,
				},
			},
			{
				accessorKey: "target",
				header: "対象",
				cell: ({ row }) => <TextCell text={row.original.target} />,
				filterFn: customFilterFn,
				sortFn: (rowA, rowB, columnId) => {
					const targetA = getStringValue(rowA.getValue(columnId));
					const targetB = getStringValue(rowB.getValue(columnId));
					return getTargetPriority(targetA) - getTargetPriority(targetB);
				},
				meta: {
					width: "150px",
					align: "center" as const,
				},
			},
			{
				accessorKey: "condition",
				header: "条件",
				cell: ({ row }) => <TextCell text={row.original.condition} />,
				filterFn: customFilterFn,
				meta: {
					width: "200px",
					align: "center" as const,
				},
			},
			{
				accessorKey: "effectTurn",
				header: "効果ターン",
				cell: ({ row }) => <TextCell text={row.original.effectTurn} />,
				filterFn: customFilterFn,
				meta: {
					width: "120px",
					align: "center" as const,
				},
			},

			{
				accessorFn: (row) => {
					const activationRate = row.activationRate;
					if (!activationRate) return -Infinity;
					return isNumber(activationRate)
						? parseFloat(activationRate)
						: getActivationRatePriority(activationRate);
				},
				id: "activationRate",
				header: "発動率",
				cell: ({ row }) => <ActivationRateCell data={row.original} />,
				filterFn: customFilterFn,
				meta: {
					width: "100px",
					align: "center" as const,
				},
			},
			{
				accessorKey: "activationCount",
				header: "発動回数",
				cell: ({ row }) => <TextCell text={row.original.activationCount} />,
				filterFn: customFilterFn,
				sortFn: (rowA, rowB, columnId) => {
					const countA = getStringOrNumberValue(rowA.getValue(columnId));
					const countB = getStringOrNumberValue(rowB.getValue(columnId));
					return getActivationCountPriority(countA) - getActivationCountPriority(countB);
				},
				meta: {
					width: "100px",
					align: "center" as const,
				},
			},
			{
				accessorKey: "note",
				header: "備考",
				cell: ({ row }) => <TextCell text={row.original.note} />,
				filterFn: customFilterFn,
			},
		],
		[customFilterFn],
	);

	// カテゴリIDに基づいてコンテンツをレンダリングする関数
	const renderContent = useCallback(
		(categoryId: string) => {
			// カテゴリIDがeffectTypeDataに存在するか確認
			if (effectTypeData[categoryId]) {
				const data = effectTypeData[categoryId];
				if (data.length === 0) return null;

				return (
					<Table data={data} columns={columns} tableId={`friends-skills-${categoryId}`} />
				);
			}

			return null;
		},
		[columns, effectTypeData],
	);

	const handleSelectCategory = useCallback(
		(id: string) => {
			if (effectTypeData[id]) {
				setSelectedEffectType(id);
			}
		},
		[effectTypeData],
	);

	return (
		<CategoryLayout
			categories={skillCategories}
			renderContent={renderContent}
			onNavigate={handleSelectCategory}
			selectedCategory={selectedEffectType}
			emptyMessage="データがありません"
		/>
	);
}

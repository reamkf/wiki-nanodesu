"use client";

import React, { useMemo, useCallback, useState } from "react";
import { AbnormalStatusWithFriend, AbnormalStatusSkillEffectType } from "@/types/abnormalStatus";
import {
	getPowerPriority,
	getActivationRatePriority,
	getTargetPriority,
	getActivationCountPriority,
} from "@/utils/sortPriorities";
import { TreeItemData } from "@/components/common/TreeList";
import { isNumber } from "@/utils/common";
import { createCustomFilterFn } from "@/utils/tableFilters";
import { CategoryLayout } from "@/components/section/CategoryLayout";
import {
	FriendOrPhotoDisplay,
	TextCell,
	getSearchableTextForFriendOrPhoto,
} from "@/components/table/GenericDataTable";
import { isAttribute, sortAttribute } from "@/utils/friends/friends";
import { FriendsAttribute } from "@/types/friends";
import { PhotoAttribute } from "@/types/photo";
import { Table, WikiTableColumnDef } from "@/components/table/Table";
import { AttributeCell, ActivationRateCell, CommonPowerCell } from "@/components/table/cells";

const ABNORMAL_STATUS_EFFECT_TYPES = Object.values(AbnormalStatusSkillEffectType);

function getAttribute(value: unknown): FriendsAttribute | PhotoAttribute {
	return isAttribute(value) ? value : FriendsAttribute.none;
}

function getStringValue(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function getStringOrNumberValue(value: unknown): string | number {
	return typeof value === "string" || typeof value === "number" ? value : "";
}

export default function ClientTabs({
	statusTypeData,
	abnormalStatusCategories,
}: {
	statusTypeData: Record<string, AbnormalStatusWithFriend[]>;
	abnormalStatusCategories: TreeItemData[];
}) {
	const [selectedStatusType, setSelectedStatusType] = useState<string | null>(null);

	const customFilterFn = useMemo(
		() => createCustomFilterFn<AbnormalStatusWithFriend>(getSearchableTextForFriendOrPhoto),
		[],
	);

	// テーブルのカラム定義
	const columns = useMemo<WikiTableColumnDef<AbnormalStatusWithFriend>[]>(
		() => [
			{
				accessorKey: "friendsIdOrPhotoName",
				header: "フレンズ/フォト",
				cell: ({ row }) => <FriendOrPhotoDisplay data={row.original} />,
				filterFn: customFilterFn,
				meta: {
					width: "250px",
				},
			},
			{
				accessorFn: (row) => {
					if (row.isPhoto) {
						return row.photoDataRow?.attribute || "";
					} else {
						return row.friendsDataRow?.attribute || "";
					}
				},
				id: "attribute",
				header: "属性",
				cell: ({ row }) => <AttributeCell data={row.original} />,
				filterFn: customFilterFn,
				sortFn: (rowA, rowB, columnId) => {
					const attributeA = getAttribute(rowA.getValue(columnId));
					const attributeB = getAttribute(rowB.getValue(columnId));

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
					if (!power) return -Infinity; // ソート用に未定義は最小値とする
					// 数値でない場合は優先度を返す
					return isNumber(power) ? parseFloat(power) : getPowerPriority(power);
				},
				id: "power",
				header: "威力",
				cell: ({ row }) => <CommonPowerCell data={row.original} />,
				// accessorFnで数値または優先度を返すようにしたので、デフォルトの数値ソートで良いはず
				// sortFn は不要（デフォルトのソートを利用）
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

	// エフェクトの内容や対象によってサブカテゴリを判定する関数
	const getCategoryForStatus = useCallback(
		(status: AbnormalStatusWithFriend, categoryId: string): boolean => {
			const { effectType, isPhoto } = status;
			const [, entityType, effectTypeId] = categoryId.split("-");

			const isPhotoCategory = entityType === "photo";
			if (isPhoto !== isPhotoCategory) return false;

			// 効果タイプと効果タイプIDの対応マップ
			const effectTypeMap = {
				give: AbnormalStatusSkillEffectType.give,
				incleaseResist: AbnormalStatusSkillEffectType.incleaseResist,
				decreaseResist: AbnormalStatusSkillEffectType.decreaseResist,
				remove: AbnormalStatusSkillEffectType.remove,
			} satisfies Record<string, AbnormalStatusSkillEffectType>;

			// 効果タイプの一致を確認
			return Object.entries(effectTypeMap).some(
				([id, value]) => id === effectTypeId && value === effectType,
			);
		},
		[],
	);

	// 状態異常とサブカテゴリでデータをフィルタリングする関数
	const filterStatusDataByCategoryAndSubcategory = useCallback(
		(categoryId: string): AbnormalStatusWithFriend[] => {
			// カテゴリIDの形式は「{状態異常}-{entityType}-{effectType}」
			const [statusType, entityType, effectTypeId] = categoryId.split("-");

			if (!statusType) return [];

			// 完全なカテゴリID（状態異常-フレンズ/フォト-効果タイプ）の場合は
			// サーバー側でソート済みのデータがあるのでそれを使用
			if (statusType && entityType && effectTypeId) {
				const fullCategoryKey = `${statusType}-${entityType}-${effectTypeId}`;
				if (statusTypeData[fullCategoryKey]) {
					return statusTypeData[fullCategoryKey];
				}
			}

			const statusData = statusTypeData[statusType] || [];
			const isPhotoCategory = entityType === "photo";

			// 第二階層（状態異常-フレンズ/フォト）の場合
			if (statusType && entityType && !effectTypeId) {
				return statusData.filter((status) => status.isPhoto === isPhotoCategory);
			}

			// 効果タイプの全てを取得する場合
			if (effectTypeId === "all") {
				return statusData.filter((status) => {
					return (
						status.isPhoto === isPhotoCategory &&
						ABNORMAL_STATUS_EFFECT_TYPES.includes(status.effectType)
					);
				});
			}

			// 効果タイプIDが指定されている場合
			return statusData.filter((status) => getCategoryForStatus(status, categoryId));
		},
		[statusTypeData, getCategoryForStatus],
	);

	// カテゴリIDに基づいてコンテンツをレンダリングする関数
	const renderContent = useCallback(
		(categoryId: string) => {
			// カテゴリIDの階層を分解
			const parts = categoryId.split("-");
			const depth = parts.length;

			// 第二階層（状態異常-フレンズ/フォト）または第三階層（状態異常-フレンズ/フォト-効果タイプ）の場合
			if (depth >= 2) {
				const statusData = filterStatusDataByCategoryAndSubcategory(categoryId);

				if (statusData.length === 0) return null;

				// サーバー側で既にソート済みのデータを使用する
				// 注: 第三階層のデータはサーバー側でソート済みなので、クライアントでの追加ソートは不要

				return (
					<Table
						data={statusData}
						columns={columns}
						tableId={`abnormal-status-${categoryId}`}
					/>
				);
			}

			// それ以外の階層の場合は何も表示しない
			return null;
		},
		[columns, filterStatusDataByCategoryAndSubcategory],
	);

	// 目次・URLハッシュでジャンプした際、リーフの折りたたみを展開する（friend-skills と同様に、データが存在するカテゴリIDをそのまま採用）
	const handleSelectCategory = useCallback(
		(id: string) => {
			if (statusTypeData[id]?.length) {
				setSelectedStatusType(id);
			}
		},
		[statusTypeData],
	);

	return (
		<CategoryLayout
			categories={abnormalStatusCategories}
			renderContent={renderContent}
			onItemClisk={handleSelectCategory}
			selectedCategory={selectedStatusType}
			emptyMessage="データがありません"
		/>
	);
}

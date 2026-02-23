"use client";

import React, { useMemo, useCallback, useState } from "react";
import {
	AbnormalStatusWithFriend,
	AbnormalStatusSkillEffectType,
} from "@/types/abnormalStatus";
import { getPowerPriority, getActivationRatePriority, getTargetPriority, getActivationCountPriority } from "@/utils/sortPriorities";
import { TreeItemData } from "@/components/common/TreeList";
import { ColumnDef } from "@tanstack/react-table";
import { isNumber } from "@/utils/common";
import { createCustomFilterFn } from "@/utils/tableFilters";
import { CategoryLayout } from "@/components/section/CategoryLayout";
import {
	FriendOrPhotoDisplay,
	TextCell,
	getSearchableTextForFriendOrPhoto
} from "@/components/table/GenericDataTable";
import { sortAttribute } from "@/utils/friends/friends";
import { FriendsAttribute } from "@/types/friends";
import { PhotoAttribute } from "@/types/photo";
import { Table } from "@/components/table/Table";
import { AttributeCell, ActivationRateCell, CommonPowerCell } from "@/components/table/cells";

export default function ClientTabs({
	statusTypes,
	statusTypeData,
	abnormalStatusCategories
}: {
	statusTypes: string[],
	statusTypeData: Record<string, AbnormalStatusWithFriend[]>,
	abnormalStatusCategories: TreeItemData[]
}) {
	const [selectedStatusType, setSelectedStatusType] = useState<string | null>(
		() => statusTypes.length > 0 ? statusTypes[0] : null
	);

	const getSearchableText = useCallback((row: AbnormalStatusWithFriend, columnId: string): string => {
		return getSearchableTextForFriendOrPhoto(row, columnId);
	}, []);

	const customFilterFn = useMemo(() => createCustomFilterFn(getSearchableText), [getSearchableText]);

	// テーブルのカラム定義
	const columns = useMemo<ColumnDef<AbnormalStatusWithFriend>[]>(() => [
		{
			accessorKey: 'friendsIdOrPhotoName',
			header: 'フレンズ/フォト',
			cell: ({ row }) => <FriendOrPhotoDisplay data={row.original} />,
			filterFn: customFilterFn,
			meta: {
				width: '250px'
			}
		},
		{
			accessorFn: (row) => {
				if (row.isPhoto) {
					return row.photoDataRow?.attribute || '';
				} else {
					return row.friendsDataRow?.attribute || '';
				}
			},
			id: 'attribute',
			header: '属性',
			cell: ({ row }) => <AttributeCell data={row.original} />,
			filterFn: customFilterFn,
			sortingFn: (rowA, rowB, columnId) => {
				const attributeA = rowA.getValue(columnId) as FriendsAttribute | PhotoAttribute;
				const attributeB = rowB.getValue(columnId) as FriendsAttribute | PhotoAttribute;

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
				if (!power) return -Infinity; // ソート用に未定義は最小値とする
				// 数値でない場合は優先度を返す
				return isNumber(power) ? parseFloat(power) : getPowerPriority(power);
			},
			id: 'power',
			header: '威力',
			cell: ({ row }) => <CommonPowerCell data={row.original} />,
			// accessorFnで数値または優先度を返すようにしたので、デフォルトの数値ソートで良いはず
			// sortingFn は不要（デフォルトのソートを利用）
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

	// エフェクトの内容や対象によってサブカテゴリを判定する関数
	const getCategoryForStatus = useCallback((status: AbnormalStatusWithFriend, categoryId: string): boolean => {
		const { effectType, isPhoto } = status;
		const [, entityType, effectTypeId] = categoryId.split('-');

		const isPhotoCategory = entityType === 'photo';
		if (isPhoto !== isPhotoCategory) return false;

		// 効果タイプと効果タイプIDの対応マップ
		const effectTypeMap: Record<string, AbnormalStatusSkillEffectType> = {
			'give': AbnormalStatusSkillEffectType.give,
			'incleaseResist': AbnormalStatusSkillEffectType.incleaseResist,
			'decreaseResist': AbnormalStatusSkillEffectType.decreaseResist,
			'remove': AbnormalStatusSkillEffectType.remove
		};

		// 効果タイプの一致を確認
		return effectTypeMap[effectTypeId] === effectType;
	}, []);

	// enumの値の配列を取得
	const abnormalStatusEffectTypes = useMemo(() =>
		Object.values(AbnormalStatusSkillEffectType),
	[]);

	// 状態異常とサブカテゴリでデータをフィルタリングする関数
	const filterStatusDataByCategoryAndSubcategory = useCallback((categoryId: string): AbnormalStatusWithFriend[] => {
		// カテゴリIDの形式は「{状態異常}-{entityType}-{effectType}」
		const [statusType, entityType, effectTypeId] = categoryId.split('-');

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
		const isPhotoCategory = entityType === 'photo';

		// 第二階層（状態異常-フレンズ/フォト）の場合
		if (statusType && entityType && !effectTypeId) {
			return statusData.filter(status => status.isPhoto === isPhotoCategory);
		}

		// 効果タイプの全てを取得する場合
		if (effectTypeId === 'all') {
			return statusData.filter(status => {
				return status.isPhoto === isPhotoCategory &&
					abnormalStatusEffectTypes.includes(status.effectType);
			});
		}

		// 効果タイプIDが指定されている場合
		return statusData.filter(status => getCategoryForStatus(status, categoryId));
	}, [statusTypeData, getCategoryForStatus, abnormalStatusEffectTypes]);

	// カテゴリIDに基づいてコンテンツをレンダリングする関数
	const renderContent = useCallback((categoryId: string) => {
		// カテゴリIDの階層を分解
		const parts = categoryId.split('-');
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
	}, [columns, filterStatusDataByCategoryAndSubcategory]);

	const handleSelectCategory = useCallback((id: string) => {
		const statusType = id.includes('-') ? id.split('-')[0] : id;
		setSelectedStatusType(statusType);
	}, []);

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
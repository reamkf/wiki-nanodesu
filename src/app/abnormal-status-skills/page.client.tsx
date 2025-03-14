"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import {
	AbnormalStatusWithFriend,
	AbnormalStatusSkillEffectType,
	getPowerPriority,
	getActivationRatePriority
} from "@/types/abnormalStatus";
import { FriendsAttributeIconAndName } from "@/components/friends/FriendsAttributeIconAndName";
import { TreeItemData } from "@/components/common/TreeList";
import { ColumnDef } from "@tanstack/react-table";
import { isNumber, toPercent } from "@/utils/common";
import { createCustomFilterFn } from "@/utils/tableFilters";
import { CategoryLayout } from "@/components/section/CategoryLayout";
import {
	GenericDataTable,
	formatText,
	FriendOrPhotoDisplay,
	getSearchableTextForFriendOrPhoto,
	TextCell
} from "@/components/table/GenericDataTable";
import { PhotoAttributeIconAndName } from "@/components/photo/PhotoAttributeIconAndName";

export default function ClientTabs({
	statusTypes,
	statusTypeData,
	abnormalStatusCategories
}: {
	statusTypes: string[],
	statusTypeData: Record<string, AbnormalStatusWithFriend[]>,
	abnormalStatusCategories: TreeItemData[]
}) {
	// 選択された状態異常タイプの状態を管理
	const [selectedStatusType, setSelectedStatusType] = useState<string | null>(null);

	// 初期選択として最初の状態異常タイプを設定
	useEffect(() => {
		if (statusTypes.length > 0 && !selectedStatusType) {
			setSelectedStatusType(statusTypes[0]);
		}
	}, [statusTypes, selectedStatusType]);

	// 検索可能なテキストを取得する関数
	const getSearchableText = useCallback((row: AbnormalStatusWithFriend, columnId: string): string => {
		// 基本的な検索用テキストは共通関数から取得
		return getSearchableTextForFriendOrPhoto(row, columnId);
	}, []);

	// カスタムフィルター関数の作成
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
			cell: ({ row }) => {
				const status = row.original;

				if (status.isPhoto && status.photoDataRow) {
					// フォトの場合
					return (
						<PhotoAttributeIconAndName attribute={status.photoDataRow.attribute} />
					);
				} else if (!status.isPhoto && status.friendsDataRow) {
					// フレンズの場合
					return (
						<FriendsAttributeIconAndName attribute={status.friendsDataRow.attribute} />
					);
				}

				return null;
			},
			filterFn: customFilterFn,
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

				return powerNum.toString();
			},
			sortingFn: (rowA, rowB) => {
				const powerA = rowA.original.power;
				const powerB = rowB.original.power;

				// 優先度に基づいてソート
				const priorityA = getPowerPriority(powerA);
				const priorityB = getPowerPriority(powerB);

				// 優先度が高いほうが上に来るように降順でソート
				return priorityB - priorityA;
			},
			filterFn: customFilterFn,
			meta: {
				width: '100px'
			}
		},
		{
			accessorKey: 'target',
			header: '対象',
			cell: ({ row }) => <TextCell text={row.original.target} />,
			filterFn: customFilterFn,
			meta: {
				width: '150px'
			}
		},
		{
			accessorKey: 'condition',
			header: '条件',
			cell: ({ row }) => <TextCell text={row.original.condition} />,
			filterFn: customFilterFn,
			meta: {
				width: '200px'
			}
		},
		{
			accessorKey: 'effectTurn',
			header: '効果ターン',
			cell: ({ row }) => <TextCell text={row.original.effectTurn} />,
			filterFn: customFilterFn,
			meta: {
				width: '120px'
			}
		},
		{
			accessorFn: (row) => {
				const activationRate = row.activationRate;
				if (!activationRate) return -Infinity;
				return isNumber(activationRate) ? toPercent(parseFloat(activationRate)) : activationRate;
			},
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
			sortingFn: (rowA, rowB) => {
				const rateA = rowA.original.activationRate;
				const rateB = rowB.original.activationRate;

				const priorityA = getActivationRatePriority(rateA);
				const priorityB = getActivationRatePriority(rateB);

				// 優先度が高いほうが上に来るように降順でソート
				return priorityB - priorityA;
			},
			filterFn: customFilterFn,
			meta: {
				width: '100px'
			}
		},
		{
			accessorKey: 'activationCount',
			header: '発動回数',
			cell: ({ row }) => <TextCell text={row.original.activationCount} />,
			filterFn: customFilterFn,
			meta: {
				width: '100px'
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

		// フレンズかフォトかで分ける
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
				<GenericDataTable
					data={statusData}
					columns={columns}
					tableId={`abnormal-status-${categoryId}`}
				/>
			);
		}

		// それ以外の階層の場合は何も表示しない
		return null;
	}, [columns, filterStatusDataByCategoryAndSubcategory]);

	// カテゴリーが選択されたときの処理
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
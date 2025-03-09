"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { AbnormalStatusWithFriend } from "@/types/abnormalStatus";
import { FriendsAttributeIconAndName } from "@/components/friends/FriendsAttributeIconAndName";
import { TableOfContentsData } from "@/components/section/TableOfContents";
import { ColumnDef } from "@tanstack/react-table";
import { isNumber } from "@/utils/common";
import { createCustomFilterFn } from "@/components/table/FilterableDataTable";
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
	abnormalStatusCategories: TableOfContentsData[]
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
			accessorKey: 'effect',
			header: '効果',
			cell: ({ row }) => <TextCell text={row.original.effect} />,
			filterFn: customFilterFn,
			meta: {
				width: '150px'
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
			accessorKey: 'activationRate',
			header: '発動率',
			cell: ({ row }) => <TextCell text={row.original.activationRate} />,
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
	const getCategoryForStatus = useCallback((status: AbnormalStatusWithFriend, subcategoryId: string): boolean => {
		const { effect, isPhoto } = status;

		// フレンズかフォトかで分ける
		const isPhotoCategory = subcategoryId.includes('photo');
		if (isPhoto !== isPhotoCategory) return false;

		// 効果内容でさらに振り分け
		if (effect.includes('付与') && subcategoryId.includes('give')) {
			return true;
		}
		if (effect.includes('耐性') && effect.includes('得る') && subcategoryId === 'resist-friends') {
			return true;
		}
		if (effect.includes('解除') && subcategoryId === 'remove-friends') {
			return true;
		}
		if (effect.includes('耐性') && effect.includes('減少') && subcategoryId.includes('reduce-resist')) {
			return true;
		}
		if (effect.includes('耐性') && effect.includes('与える') && subcategoryId === 'give-resist-photo') {
			return true;
		}

		// デフォルトは一致しない
		return false;
	}, []);

	// 状態異常とサブカテゴリでデータをフィルタリングする関数
	const filterStatusDataByCategoryAndSubcategory = useCallback((
		statusType: string,
		subcategoryId: string
	): AbnormalStatusWithFriend[] => {
		const statusData = statusTypeData[statusType] || [];

		// サブカテゴリIDの形式は「{状態異常}-{サブカテゴリ}」
		const subCatId = subcategoryId.split('-').slice(1).join('-');

		return statusData.filter(status => getCategoryForStatus(status, subCatId));
	}, [statusTypeData, getCategoryForStatus]);

	// カテゴリIDに基づいてコンテンツをレンダリングする関数
	const renderContent = useCallback((categoryId: string) => {
		// サブカテゴリの場合（状態異常-サブカテゴリID）
		if (categoryId.includes('-')) {
			const statusData = filterStatusDataByCategoryAndSubcategory(
				categoryId.split('-')[0],
				categoryId
			);

			if (statusData.length === 0) return null;

			return (
				<GenericDataTable
					data={statusData}
					columns={columns}
					tableId={`abnormal-status-${categoryId}`}
				/>
			);
		}

		// 通常の状態異常タイプの場合
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
			onSelectCategory={handleSelectCategory}
			selectedCategory={selectedStatusType}
			emptyMessage="データがありません"
		/>
	);
}
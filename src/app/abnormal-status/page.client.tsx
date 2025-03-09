"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { AbnormalStatusWithFriend } from "@/types/abnormalStatus";
import { FriendsNameLink } from "@/components/friends/FriendsNameLink";
import { FriendsAttributeIconAndName } from "@/components/friends/FriendsAttributeIconAndName";
import { TableOfContentsData } from "@/components/section/TableOfContents";
import { SeesaaWikiImage } from "@/components/seesaawiki/SeesaaWikiImage";
import { parseSeesaaWikiNewLine } from "@/utils/seesaaWiki";
import { ColumnDef } from "@tanstack/react-table";
import { isNumber } from "@/utils/common";
import { FilterableDataTable, createCustomFilterFn } from "@/components/table/FilterableDataTable";
import { CategoryLayout } from "@/components/section/CategoryLayout";

// FilterableDataTableで使用する型付きのラッパーコンポーネント
const AbnormalStatusTable = ({ data, columns, tableId }: {
	data: AbnormalStatusWithFriend[];
	columns: ColumnDef<AbnormalStatusWithFriend, unknown>[];
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

	// formatText関数をメモ化
	const formatText = useCallback((text: string): React.ReactElement => {
		return parseSeesaaWikiNewLine(text);
	}, []);

	// 検索可能なテキストを取得する関数
	const getSearchableText = useCallback((row: AbnormalStatusWithFriend, columnId: string): string => {
		switch (columnId) {
			case "name":
			case "icon":
				if (row.isPhoto) {
					return row.photoDataRow?.name || '';
				} else {
					return row.friendsDataRow?.secondName
						? `${row.friendsDataRow.secondName} ${row.friendsDataRow.name}`
						: row.friendsDataRow?.name || '';
				}
			case "attribute":
				if (row.isPhoto) {
					return row.photoDataRow?.attribute || '';
				} else {
					return row.friendsDataRow?.attribute || '';
				}
			default:
				return (
					row[columnId as keyof AbnormalStatusWithFriend]?.toString() ?? ""
				);
		}
	}, []);

	// カスタムフィルター関数の作成
	const customFilterFn = useMemo(() => createCustomFilterFn(getSearchableText), [getSearchableText]);

	// テーブルのカラム定義
	const columns = useMemo<ColumnDef<AbnormalStatusWithFriend>[]>(() => [
		{
			accessorKey: 'friendsIdOrPhotoName',
			header: 'フレンズ/フォト',
			cell: ({ row }) => {
				const status = row.original;

				if (status.isPhoto && status.photoDataRow) {
					// フォトの場合
					return (
						<div className="text-sm flex items-center space-x-2">
							{status.photoDataRow.iconUrl && (
								<div className="shrink-0">
									<SeesaaWikiImage
										src={status.photoDataRow.iconUrl}
										alt={status.photoDataRow.name}
										width={45}
										height={45}
										className="rounded-xs"
									/>
								</div>
							)}
							<div>
								<div className="font-bold">
									{status.photoDataRow.name}
								</div>
								<div className="text-xs text-gray-600">
									⭐{status.photoDataRow.rarity}
								</div>
							</div>
						</div>
					);
				} else if (!status.isPhoto && status.friendsDataRow) {
					// フレンズの場合
					return (
						<div className="text-sm flex items-center space-x-2">
							{status.friendsDataRow.iconUrl && (
								<div className="shrink-0">
									<SeesaaWikiImage
										src={status.friendsDataRow.iconUrl}
										alt={status.friendsDataRow.name}
										width={45}
										height={45}
										className="rounded-xs"
									/>
								</div>
							)}
							<FriendsNameLink friend={status.friendsDataRow} />
						</div>
					);
				} else {
					// データが見つからない場合はIDまたは名前をそのまま表示
					return <div>{status.friendsIdOrPhotoName}</div>;
				}
			},
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
						<div className="text-sm">
							{status.photoDataRow.attribute}
						</div>
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
			accessorKey: 'effect',
			header: '効果',
			cell: ({ row }) => {
				const text = row.original.effect;
				if (!text) return null;
				return formatText(text);
			},
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
				<AbnormalStatusTable
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
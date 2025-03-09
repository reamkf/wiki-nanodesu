"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { AbnormalStatusWithFriend, AbnormalStatusSkillEffectType } from "@/types/abnormalStatus";
import { FriendsAttributeIconAndName } from "@/components/friends/FriendsAttributeIconAndName";
import { TableOfContentsData } from "@/components/section/TableOfContents";
import { ColumnDef } from "@tanstack/react-table";
import { isNumber, toPercent } from "@/utils/common";
import { createCustomFilterFn } from "@/components/table/FilterableDataTable";
import { CategoryLayout } from "@/components/section/CategoryLayout";
import { FriendsAttribute, FriendsAttributeOrder } from "@/types/friends";
import { PhotoAttribute, photoAttributeOrder } from "@/types/photo";
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

		// 完全なカテゴリID（状態異常-フレンズ/フォト-効果タイプ）の場合
		return statusData.filter(status => getCategoryForStatus(status, categoryId));
	}, [statusTypeData, getCategoryForStatus, abnormalStatusEffectTypes]);

	// 威力の優先順位を取得する関数
	const getPowerPriority = useCallback((power: string): number => {
		if (!power) return -1;

		const powerMap: Record<string, number> = {
			'完全耐性': 6,
			'高': 5,
			'大': 4,
			'中': 3,
			'低': 2,
			'小': 1,
		};

		return powerMap[power] || 0;
	}, []);

	// 対象の優先順位を取得する関数
	const getTargetPriority = useCallback((target: string): number => {
		if (!target) return -1;

		if (target.includes('味方全体')) return 3;
		if (target.includes('自身を除く') && target.includes('味方全体')) return 2;
		if (target.includes('自身')) return 1;

		return 0;
	}, []);

	// わざ種別の優先順位を取得する関数
	const getSkillTypePriority = useCallback((skillType: string): number => {
		if (!skillType) return -1;

		if (skillType === 'とくせい' || skillType === 'キセキとくせい' || skillType === 'なないろとくせい') return 1;

		return 0;
	}, []);

	// 付与率の優先順位を取得する関数
	const getActivationRatePriority = useCallback((activationRate: string): number => {
		if (!activationRate) return -1;

		// 数値+%の形式（例：100%、75%など）をチェック
		const percentMatch = activationRate.match(/^(\d+)%$/);
		if (percentMatch) {
			// 数値を抽出して、100を基準にソート（大きいほど優先度が高い）
			return 100 + parseInt(percentMatch[1], 10);
		}

		const rateMap: Record<string, number> = {
			'-': 100,
			'高確率': 90,
			'中確率': 50,
			'低確率': 30
		};

		return rateMap[activationRate] || 0;
	}, []);

	// 属性のみでソートする関数
	const sortByAttribute = useCallback((data: AbnormalStatusWithFriend[]): AbnormalStatusWithFriend[] => {
		return [...data].sort((a, b) => {
			// 属性でソート (FriendsAttributeOrderとphotoAttributeOrderの昇順)
			const attributeA = a.isPhoto ? a.photoDataRow?.attribute || '' : a.friendsDataRow?.attribute || '';
			const attributeB = b.isPhoto ? b.photoDataRow?.attribute || '' : b.friendsDataRow?.attribute || '';

			// フレンズとフォトで異なる属性順序を適用
			let orderA = 999;
			let orderB = 999;

			if (a.isPhoto) {
				// フォトの場合
				orderA = attributeA ? photoAttributeOrder[attributeA as PhotoAttribute] ?? 999 : 999;
			} else {
				// フレンズの場合
				orderA = attributeA ? FriendsAttributeOrder[attributeA as FriendsAttribute] ?? 999 : 999;
			}

			if (b.isPhoto) {
				// フォトの場合
				orderB = attributeB ? photoAttributeOrder[attributeB as PhotoAttribute] ?? 999 : 999;
			} else {
				// フレンズの場合
				orderB = attributeB ? FriendsAttributeOrder[attributeB as FriendsAttribute] ?? 999 : 999;
			}

			return orderA - orderB; // 昇順
		});
	}, []);

	// 付与スキルのソート関数（属性 + 付与率）
	const sortGiveSkills = useCallback((data: AbnormalStatusWithFriend[]): AbnormalStatusWithFriend[] => {
		return [...data].sort((a, b) => {
			// 1. 属性でソート (FriendsAttributeOrderとphotoAttributeOrderの昇順)
			const attributeA = a.isPhoto ? a.photoDataRow?.attribute || '' : a.friendsDataRow?.attribute || '';
			const attributeB = b.isPhoto ? b.photoDataRow?.attribute || '' : b.friendsDataRow?.attribute || '';

			// フレンズとフォトで異なる属性順序を適用
			let orderA = 999;
			let orderB = 999;

			if (a.isPhoto) {
				// フォトの場合
				orderA = attributeA ? photoAttributeOrder[attributeA as PhotoAttribute] ?? 999 : 999;
			} else {
				// フレンズの場合
				orderA = attributeA ? FriendsAttributeOrder[attributeA as FriendsAttribute] ?? 999 : 999;
			}

			if (b.isPhoto) {
				// フォトの場合
				orderB = attributeB ? photoAttributeOrder[attributeB as PhotoAttribute] ?? 999 : 999;
			} else {
				// フレンズの場合
				orderB = attributeB ? FriendsAttributeOrder[attributeB as FriendsAttribute] ?? 999 : 999;
			}

			if (orderA !== orderB) return orderA - orderB; // 昇順

			// 2. 付与率でソート（"-" > "100%" > "高確率" > "中確率" > "低確率"）
			const ratePriorityA = getActivationRatePriority(a.activationRate);
			const ratePriorityB = getActivationRatePriority(b.activationRate);

			return ratePriorityB - ratePriorityA; // 付与率は降順
		});
	}, [getActivationRatePriority]);

	// 耐性増加/減少スキルのソート関数
	const sortResistanceSkills = useCallback((data: AbnormalStatusWithFriend[]): AbnormalStatusWithFriend[] => {
		return [...data].sort((a, b) => {
			// 1. 対象でソート（味方全体 > 自身を除く味方全体 > 自身）
			const targetPriorityA = getTargetPriority(a.target);
			const targetPriorityB = getTargetPriority(b.target);
			if (targetPriorityA !== targetPriorityB) return targetPriorityB - targetPriorityA;

			// 2. 属性でソート (FriendsAttributeOrderの昇順)
			const attributeA = a.isPhoto ? a.photoDataRow?.attribute || '' : a.friendsDataRow?.attribute || '';
			const attributeB = b.isPhoto ? b.photoDataRow?.attribute || '' : b.friendsDataRow?.attribute || '';

			// フレンズとフォトで異なる属性順序を適用
			let orderA = 999;
			let orderB = 999;

			if (a.isPhoto) {
				// フォトの場合
				orderA = attributeA ? photoAttributeOrder[attributeA as PhotoAttribute] ?? 999 : 999;
			} else {
				// フレンズの場合
				orderA = attributeA ? FriendsAttributeOrder[attributeA as FriendsAttribute] ?? 999 : 999;
			}

			if (b.isPhoto) {
				// フォトの場合
				orderB = attributeB ? photoAttributeOrder[attributeB as PhotoAttribute] ?? 999 : 999;
			} else {
				// フレンズの場合
				orderB = attributeB ? FriendsAttributeOrder[attributeB as FriendsAttribute] ?? 999 : 999;
			}

			if (orderA !== orderB) return orderA - orderB; // 昇順

			// 3. 威力でソート（高 > 大 > 中 > 低 > 小）
			const powerPriorityA = getPowerPriority(a.power);
			const powerPriorityB = getPowerPriority(b.power);
			if (powerPriorityA !== powerPriorityB) return powerPriorityB - powerPriorityA;

			// 4. わざ種別でソート（とくせい・キセキとくせい・なないろとくせい > その他）
			const skillTypePriorityA = getSkillTypePriority(a.skillType);
			const skillTypePriorityB = getSkillTypePriority(b.skillType);
			return skillTypePriorityB - skillTypePriorityA;
		});
	}, [getPowerPriority, getTargetPriority, getSkillTypePriority]);

	// カテゴリIDに基づいてコンテンツをレンダリングする関数
	const renderContent = useCallback((categoryId: string) => {
		// カテゴリIDの階層を分解
		const parts = categoryId.split('-');
		const depth = parts.length;

		// 第二階層（状態異常-フレンズ/フォト）または第三階層（状態異常-フレンズ/フォト-効果タイプ）の場合
		if (depth >= 2) {
			let statusData = filterStatusDataByCategoryAndSubcategory(categoryId);

			if (statusData.length === 0) return null;

			// カテゴリによって適切なソートを適用
			const [, , effectTypeId] = categoryId.split('-');
			if (effectTypeId === 'incleaseResist' || effectTypeId === 'decreaseResist') {
				// 耐性増加/減少スキルには特別なソートを適用
				statusData = sortResistanceSkills(statusData);
			} else if (effectTypeId === 'give') {
				// 付与スキルには属性+付与率でソート
				statusData = sortGiveSkills(statusData);
			} else {
				// その他のカテゴリーには属性のみでソート
				statusData = sortByAttribute(statusData);
			}

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
	}, [columns, filterStatusDataByCategoryAndSubcategory, sortResistanceSkills, sortByAttribute, sortGiveSkills]);

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
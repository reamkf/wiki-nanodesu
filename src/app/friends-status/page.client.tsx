"use client";

import { FriendsStatusListItemWithDisplayValue } from "@/utils/friends/friendsStatus";
import FriendsIcon from "../../components/friends/FriendsIcon";
import { FriendsNameLink } from "../../components/friends/FriendsNameLink";
import {
	createColumnHelper,
	SortingState,
	Row,
	Cell,
	flexRender,
	ColumnDef,
} from "@tanstack/react-table";
import React, { useMemo, useState, useEffect, useSyncExternalStore } from "react";
import { FriendsAttributeIconAndName } from "../../components/friends/FriendsAttributeIconAndName";
import { sortAttribute } from "@/utils/friends/friends";
import { FriendsAttribute } from "@/types/friends";
import { Table } from "@/components/table/Table";
import {
	FilterCheckboxGroup,
	CheckboxOption,
} from "../../components/table/FilterCheckboxGroup";
import { ColumnMeta } from "@/components/table/Table";
import { STATUS_TYPES, getSearchableText, sortAndFilterFriendsList } from "@/utils/friends/friendsStatusHelpers";
import { createCustomFilterFn } from "@/utils/tableFilters";

const columnHelper = createColumnHelper<FriendsStatusListItemWithDisplayValue>();

const statusTypeBackgroundColor: {
	[key: string]: {
		row: string;
		checkbox: {
			unchecked: string;
			checked: string;
			hover: string;
			color: string;
		};
	};
} = {
	"☆6/Lv90/野生4": {
		row: "bg-green-100 hover:bg-green-50",
		checkbox: {
			unchecked: "#f0fdf4",
			checked: "#dcfce7",
			hover: "#bbf7d0",
			color: "#16a34a",
		},
	},
	"☆6/Lv99/野生4": {
		row: "bg-blue-100 hover:bg-blue-50",
		checkbox: {
			unchecked: "#eff6ff",
			checked: "#dbeafe",
			hover: "#bfdbfe",
			color: "#2563eb",
		},
	},
	"☆6/Lv200/野生4": {
		row: "bg-red-100 hover:bg-red-50",
		checkbox: {
			unchecked: "#fef2f2",
			checked: "#fee2e2",
			hover: "#fecaca",
			color: "#dc2626",
		},
	},
	"☆6/Lv90/野生5": {
		row: "bg-green-100 hover:bg-green-50",
		checkbox: {
			unchecked: "#f0fdf4",
			checked: "#dcfce7",
			hover: "#bbf7d0",
			color: "#16a34a",
		},
	},
	"☆6/Lv99/野生5": {
		row: "bg-blue-100 hover:bg-blue-50",
		checkbox: {
			unchecked: "#eff6ff",
			checked: "#dbeafe",
			hover: "#bfdbfe",
			color: "#2563eb",
		},
	},
	"☆6/Lv200/野生5": {
		row: "bg-red-100 hover:bg-red-50",
		checkbox: {
			unchecked: "#fef2f2",
			checked: "#fee2e2",
			hover: "#fecaca",
			color: "#dc2626",
		},
	},
};

function StatusTypeLabel({
	statusType,
	showRank = true,
	showLv = true,
	showYasei = true,
} : {
	statusType: string;
	showRank?: boolean;
	showLv?: boolean;
	showYasei?: boolean;
}){
	const [rank, lv, yasei] = statusType.split("/");
	const isYasei5 = statusType.includes("野生5");

	return (
		<>
			{showRank && rank + "/"}
			{showLv && lv + "/"}
			{showYasei && (
				isYasei5 ? (
					<span className="font-bold bg-yellow-200 text-red-600 px-1 rounded-sm">
						{yasei}
					</span>
				) : (
					`${yasei}`
				)
			)}
		</>
	);
};

function StatusCell({
	value,
	isEstimated,
	showCostumeBonus,
	costumeBonus,
}: {
	value: number;
	isEstimated: boolean;
	showCostumeBonus: boolean;
	costumeBonus?: number;
}){
	return (
		<>
			<div
				className={`${
					isEstimated ? "italic text-gray-600 bg-red-200" : ""
				} inline-block ml-auto px-1`}
			>
				<span>{value === -Infinity ? "?????" : value.toLocaleString()}</span>
			</div>
			{showCostumeBonus && (
				<div>
					{value !== -Infinity && costumeBonus && (
						<span className="block text-xs text-gray-600 px-1">
							[+{costumeBonus.toLocaleString()}]
						</span>
					)}
				</div>
			)}
		</>
	);
};

// カスタム検索関数
const customFilterFn = createCustomFilterFn<FriendsStatusListItemWithDisplayValue>(getSearchableText);

// メモ化された行コンポーネント
const TableRow = React.memo(function TableRow({
	row,
}: {
	row: Row<FriendsStatusListItemWithDisplayValue>;
}) {
	const statusType = row.original.statusType;
	const bgColorClass =
		statusTypeBackgroundColor[statusType]?.row || "hover:bg-gray-50";

	return (
		<tr className={bgColorClass}>
			{row
				.getVisibleCells()
				.map((cell: Cell<FriendsStatusListItemWithDisplayValue, unknown>) => (
					<td
						key={cell.id}
						className="border-[1px] border-gray-300 px-4 py-2"
						style={{
							textAlign:
								(cell.column.columnDef.meta as ColumnMeta)?.align || "left",
						}}
					>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</td>
				))}
		</tr>
	);
});

const STATUS_TYPE_OPTIONS: CheckboxOption[] = STATUS_TYPES.map(
	(statusType) => ({
		id: statusType,
		label: <StatusTypeLabel statusType={statusType} showRank={false} />,
		styles: {
			backgroundColor: {
				unchecked: statusTypeBackgroundColor[statusType].checkbox.unchecked,
				checked: statusTypeBackgroundColor[statusType].checkbox.checked,
				hover: statusTypeBackgroundColor[statusType].checkbox.hover,
			},
			textColor: statusTypeBackgroundColor[statusType].checkbox.color,
		},
	})
);

const OTHER_OPTIONS: CheckboxOption[] = [
	{
		id: "showCostumeBonus",
		label: "衣装補正を含む",
		styles: {
			backgroundColor: {
				unchecked: "#fefce8",
				checked: "#fef9c3",
				hover: "#fef08a",
			},
			textColor: "#ca8a04",
		},
	},
	{
		id: "hideNullStatus",
		label: "不明なステータスを非表示",
		styles: {
			backgroundColor: {
				unchecked: "#f3f4f6",
				checked: "#e5e7eb",
				hover: "#d1d5db",
			},
			textColor: "#4b5563",
		},
	},
];

export default function FriendsStatusTable({
	friendsStatusList,
	defaultStatusTypes,
}: {
	friendsStatusList: FriendsStatusListItemWithDisplayValue[];
	defaultStatusTypes?: string[];
}) {
	const isMounted = useSyncExternalStore(
		(cb) => { cb(); return () => {}; },
		() => true,
		() => false,
	);
	const defaultStatusTypesSet = useMemo(() =>
		new Set(defaultStatusTypes || STATUS_TYPES),
		[defaultStatusTypes]
	);

	const [selectedStatusTypes, setSelectedStatusTypes] = useState<Set<string>>(
		() => {
			if (typeof window !== "undefined") {
				const saved = localStorage.getItem("wiki-nanodesu.friends-status.selectedStatusTypes");
				return saved ? new Set(JSON.parse(saved)) : defaultStatusTypesSet;
			}
			return defaultStatusTypesSet;
		}
	);

	const [hideNullStatus, setHideNullStatus] = useState(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("wiki-nanodesu.friends-status.hideNullStatus");
			return saved ? JSON.parse(saved) : false;
		}
		return false;
	});

	const [showCostumeBonus, setShowCostumeBonus] = useState<boolean>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("wiki-nanodesu.friends-status.showCostumeBonus");
			return saved ? JSON.parse(saved) : false;
		}
		return false;
	});

	// ソート状態
	const [sorting, setSorting] = useState<SortingState>([{id: 'kemosute', desc: true}]);

	// 設定の永続化
	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("wiki-nanodesu.friends-status.hideNullStatus", JSON.stringify(hideNullStatus));
			localStorage.setItem(
				"wiki-nanodesu.friends-status.selectedStatusTypes",
				JSON.stringify(Array.from(selectedStatusTypes))
			);
			localStorage.setItem(
				"wiki-nanodesu.friends-status.showCostumeBonus",
				JSON.stringify(showCostumeBonus)
			);
		}
	}, [hideNullStatus, selectedStatusTypes, showCostumeBonus]);

	const filteredData = useMemo(() => {
		// まだマウントされていない場合は、サーバーからのプリフィルターデータを使用
		if (!isMounted) {
			return friendsStatusList;
		}

		// クライアント側でフィルタリングとソートを行う
		return sortAndFilterFriendsList(
			friendsStatusList,
			selectedStatusTypes,
			hideNullStatus,
			sorting[0]?.id || "kemosute",
			sorting[0]?.desc ?? true,
			showCostumeBonus
		);
	}, [
		friendsStatusList,
		selectedStatusTypes,
		hideNullStatus,
		isMounted,
		sorting,
		showCostumeBonus,
	]);

	const handleSelectedStatusTypeChange = (statusType: string) => {
		setSelectedStatusTypes((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(statusType)) {
				newSet.delete(statusType);
			} else {
				newSet.add(statusType);
			}
			return newSet;
		});
	};

	// showCostumeBonusの変更時にソート状態を更新するハンドラー
	const handleShowCostumeBonusChange = (checked: boolean) => {
		setShowCostumeBonus(checked);
		// 現在のソート状態を維持しながら再ソート
		setSorting((prev) => {
			if (prev.length === 0) return [{ id: "kemosute", desc: true }];
			return [{ ...prev[0], desc: true }]; // 降順で再ソート
		});
	};

	const columns = useMemo(() => {
		const cols = [
			columnHelper.accessor((row) => row, {
				id: "icon",
				header: "アイコン",
				cell: (info) => (
					<div className="flex justify-center">
						<FriendsIcon
							friendsData={info.getValue().friendsDataRow}
							size={55}
						/>
					</div>
				),
				enableSorting: false,
				filterFn: customFilterFn,
				meta: {
					align: "center" as const,
					width: "100px",
				},
			}),
			columnHelper.accessor((row) => row.sortValues.name, {
				id: "name",
				header: "フレンズ名",
				cell: (info) => {
					return (
						<div>
							<FriendsNameLink friend={info.row.original.friendsDataRow} />
							<div className="text-xs text-gray-700">
								<StatusTypeLabel statusType={info.row.original.statusType}/>
							</div>
						</div>
					);
				},
				filterFn: customFilterFn,
				meta: {
					align: "left" as const,
					width: "250px",
				},
			}),
			columnHelper.accessor((row) => row.sortValues.attribute, {
				id: "attribute",
				header: "属性",
				cell: (info) => (
					<FriendsAttributeIconAndName attribute={info.getValue() as FriendsAttribute} />
				),
				filterFn: customFilterFn,
				sortingFn: (rowA, rowB, columnId) => {
					const attributeA = rowA.getValue(columnId) as FriendsAttribute;
					const attributeB = rowB.getValue(columnId) as FriendsAttribute;
					return sortAttribute(attributeA, attributeB);
				},
				meta: {
					align: "center" as const,
					width: "100px",
				},
			}),
			columnHelper.accessor(
				(row) =>
					showCostumeBonus
						? row.sortValues.kemosuteWithCostume
						: row.sortValues.kemosute,
				{
					id: "kemosute",
					header: "けもステ",
					cell: (info) => {
						const baseValue = info.row.original.sortValues.kemosute;
						const withCostume =
							info.row.original.sortValues.kemosuteWithCostume;
						return (
							<StatusCell
								value={showCostumeBonus ? withCostume : baseValue}
								isEstimated={info.row.original.status.estimated ?? false}
								showCostumeBonus={showCostumeBonus}
								costumeBonus={withCostume - baseValue}
							/>
						);
					},
					filterFn: customFilterFn,
					meta: {
						align: "right" as const,
						width: "100px",
					},
				}
			),
			columnHelper.accessor(
				(row) =>
					showCostumeBonus ? row.sortValues.hpWithCostume : row.sortValues.hp,
				{
					id: "hp",
					header: "たいりょく",
					cell: (info) => {
						const baseValue = info.row.original.sortValues.hp;
						const withCostume = info.row.original.sortValues.hpWithCostume;
						return (
							<StatusCell
								value={showCostumeBonus ? withCostume : baseValue}
								isEstimated={info.row.original.status.estimated ?? false}
								showCostumeBonus={showCostumeBonus}
								costumeBonus={withCostume - baseValue}
							/>
						);
					},
					filterFn: customFilterFn,
					meta: {
						align: "right" as const,
						width: "100px",
					},
				}
			),
			columnHelper.accessor(
				(row) =>
					showCostumeBonus ? row.sortValues.atkWithCostume : row.sortValues.atk,
				{
					id: "atk",
					header: "こうげき",
					cell: (info) => {
						const baseValue = info.row.original.sortValues.atk;
						const withCostume = info.row.original.sortValues.atkWithCostume;
						return (
							<StatusCell
								value={showCostumeBonus ? withCostume : baseValue}
								isEstimated={info.row.original.status.estimated ?? false}
								showCostumeBonus={showCostumeBonus}
								costumeBonus={withCostume - baseValue}
							/>
						);
					},
					filterFn: customFilterFn,
					meta: {
						align: "right" as const,
						width: "100px",
					},
				}
			),
			columnHelper.accessor(
				(row) =>
					showCostumeBonus ? row.sortValues.defWithCostume : row.sortValues.def,
				{
					id: "def",
					header: "まもり",
					cell: (info) => {
						const baseValue = info.row.original.sortValues.def;
						const withCostume = info.row.original.sortValues.defWithCostume;
						return (
							<StatusCell
								value={showCostumeBonus ? withCostume : baseValue}
								isEstimated={info.row.original.status.estimated ?? false}
								showCostumeBonus={showCostumeBonus}
								costumeBonus={withCostume - baseValue}
							/>
						);
					},
					filterFn: customFilterFn,
					meta: {
						align: "right" as const,
						width: "100px",
					},
				}
			),
			columnHelper.accessor((row) => row.sortValues.avoid, {
				id: "avoid",
				header: "かいひ",
				cell: (info) => info.row.original.displayValues.avoid,
				filterFn: customFilterFn,
				meta: {
					align: "right" as const,
					width: "100px",
				},
			}),
		];
		return cols as ColumnDef<FriendsStatusListItemWithDisplayValue, unknown>[];
	}, [showCostumeBonus]);

	if (!isMounted) return null;

	return (
		<div className="space-y-2">
			{/* ステータスタイプ選択 */}
			<FilterCheckboxGroup
				options={STATUS_TYPE_OPTIONS}
				selectedIds={selectedStatusTypes}
				onChange={handleSelectedStatusTypeChange}
			/>

			{/* オプション */}
			<FilterCheckboxGroup
				options={OTHER_OPTIONS}
				selectedIds={
					new Set([
						...(showCostumeBonus ? ["showCostumeBonus"] : []),
						...(hideNullStatus ? ["hideNullStatus"] : []),
					])
				}
				onChange={(id) => {
					if (id === "showCostumeBonus") {
						handleShowCostumeBonusChange(!showCostumeBonus);
					} else if (id === "hideNullStatus") {
						setHideNullStatus(!hideNullStatus);
					}
				}}
			/>

			{/* テーブル */}
			<div className="overflow-x-auto max-w-full">
				<Table
					data={filteredData}
					columns={columns}
					tableId="friends-status"
					initialState={{ sorting }}
					rowComponent={TableRow}
				/>
			</div>
		</div>
	);
}

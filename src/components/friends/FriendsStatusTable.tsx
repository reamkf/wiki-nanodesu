"use client";

import { ProcessedFriendsStatusListItem } from "@/utils/friendsStatus";
import FriendsIcon from "./FriendsIcon";
import { FriendsNameLink } from "./FriendsNameLink";
import {
	createColumnHelper,
	SortingState,
	ColumnFiltersState,
	PaginationState,
	Row,
	Cell,
	flexRender,
	useReactTable,
	getCoreRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	ColumnDef,
} from "@tanstack/react-table";
import React, { useMemo, useState, useEffect } from "react";
import { FriendsAttributeIconAndName } from "./FriendsAttributeIconAndName";
import { normalizeQuery } from "@/utils/queryNormalizer";
import { SortableTable } from "../table/SortableTable";
import { TablePagination } from "../table/TablePagination";
import {
	FilterCheckboxGroup,
	CheckboxOption,
} from "../table/FilterCheckboxGroup";
import { ColumnMeta } from "@/types/common";

// ステータスタイプの定義
const STATUS_TYPES = [
	"☆6/Lv200/野生4",
	"☆6/Lv200/野生5",
	"☆6/Lv99/野生4",
	"☆6/Lv99/野生5",
	"☆6/Lv90/野生4",
	"☆6/Lv90/野生5",
] as const;

const columnHelper = createColumnHelper<ProcessedFriendsStatusListItem>();

interface FriendsStatusTableProps {
	friendsStatusList: ProcessedFriendsStatusListItem[];
}

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

const getSearchableText = (
	row: ProcessedFriendsStatusListItem,
	columnId: string
): string => {
	switch (columnId) {
		case "name":
		case "icon":
			return row.friendsDataRow.secondName
				? `${row.friendsDataRow.secondName} ${row.friendsDataRow.name}`
				: row.friendsDataRow.name;
		case "attribute":
			return row.friendsDataRow.attribute;
		default:
			return (
				row.displayValues[columnId as keyof typeof row.displayValues] ?? ""
			);
	}
};

const renderYaseiLevel = (statusType: string) => {
	const [, lv, yasei] = statusType.split("/");
	const isYasei5 = statusType.includes("野生5");

	return (
		<>
			{lv}/
			{isYasei5 ? (
				<span className="font-bold bg-yellow-200 text-red-600 px-1 rounded">
					{yasei}
				</span>
			) : (
				`${yasei}`
			)}
		</>
	);
};

interface StatusCellProps {
	value: number;
	isEstimated: boolean;
	showCostumeBonus: boolean;
	costumeBonus?: number;
}

const StatusCell: React.FC<StatusCellProps> = ({
	value,
	isEstimated,
	showCostumeBonus,
	costumeBonus,
}) => {
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
const customFilterFn = (
	row: Row<ProcessedFriendsStatusListItem>,
	columnId: string,
	filterValue: string
) => {
	const searchText = getSearchableText(row.original, columnId);
	return normalizeQuery(searchText).includes(normalizeQuery(filterValue));
};

// メモ化された行コンポーネント
const TableRow = React.memo(function TableRow({
	row,
}: {
	row: Row<ProcessedFriendsStatusListItem>;
}) {
	const statusType = row.original.statusType;
	const bgColorClass =
		statusTypeBackgroundColor[statusType]?.row || "hover:bg-gray-50";

	return (
		<tr className={bgColorClass}>
			{row
				.getVisibleCells()
				.map((cell: Cell<ProcessedFriendsStatusListItem, unknown>) => (
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

export default function FriendsStatusTable({
	friendsStatusList,
}: FriendsStatusTableProps) {
	const [isMounted, setIsMounted] = useState(false);

	const [selectedStatusTypes, setSelectedStatusTypes] = useState<Set<string>>(
		() => {
			if (typeof window !== "undefined") {
				const saved = localStorage.getItem("wiki-nanodesu.friends-status.selectedStatusTypes");
				return saved ? new Set(JSON.parse(saved)) : new Set(STATUS_TYPES);
			}
			return new Set(STATUS_TYPES);
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

	const [sorting, setSorting] = useState<SortingState>([
		{
			id: "kemosute",
			desc: true,
		},
	]);

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const [pagination, setPagination] = useState<PaginationState>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("wiki-nanodesu.friends-status.pagination");
			return saved ? JSON.parse(saved) : { pageIndex: 0, pageSize: 100 };
		}
		return { pageIndex: 0, pageSize: 100 };
	});

	useEffect(() => {
		setIsMounted(true);
	}, []);

	// 設定の永続化
	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("wiki-nanodesu.friends-status.hideNullStatus", JSON.stringify(hideNullStatus));
			localStorage.setItem(
				"wiki-nanodesu.friends-status.selectedStatusTypes",
				JSON.stringify(Array.from(selectedStatusTypes))
			);
			localStorage.setItem("wiki-nanodesu.friends-status.pagination", JSON.stringify(pagination));
			localStorage.setItem(
				"wiki-nanodesu.friends-status.showCostumeBonus",
				JSON.stringify(showCostumeBonus)
			);
		}
	}, [hideNullStatus, selectedStatusTypes, pagination, showCostumeBonus]);

	const filteredData = useMemo(() => {
		if (friendsStatusList.length === 0) return [];

		return friendsStatusList.filter((item) => {
			if (
				hideNullStatus &&
				[item.status.hp, item.status.atk, item.status.def].some(
					(status) => status === null
				)
			) {
				return false;
			}
			return selectedStatusTypes.has(item.statusType);
		});
	}, [friendsStatusList, selectedStatusTypes, hideNullStatus]);

	const handleStatusTypeChange = (statusType: string) => {
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
					const statusType = info.row.original.statusType;
					const isYasei5 = statusType.includes("野生5");
					const [baseText, yasei] = statusType.split("/野生");
					return (
						<div>
							<FriendsNameLink friend={info.row.original.friendsDataRow} />
							<div className="text-xs text-gray-700">
								{baseText}/
								{isYasei5 ? (
									<span className="font-bold bg-yellow-200 text-red-600 px-1 rounded">
										野生{yasei}
									</span>
								) : (
									`野生${yasei}`
								)}
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
					<FriendsAttributeIconAndName attribute={info.getValue()} />
				),
				filterFn: customFilterFn,
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
		return cols as ColumnDef<ProcessedFriendsStatusListItem, unknown>[];
	}, [showCostumeBonus]);

	const table = useReactTable({
		data: filteredData,
		columns,
		state: { sorting, columnFilters, pagination },
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		enableSorting: true,
		enableFilters: true,
		enableColumnFilters: true,
		manualSorting: false,
		manualFiltering: false,
	});

	if (!isMounted) return null;

	// FilterCheckboxGroup用のオプションを作成
	const statusTypeOptions: CheckboxOption[] = STATUS_TYPES.map(
		(statusType) => ({
			id: statusType,
			label: renderYaseiLevel(statusType),
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

	// オプション用のチェックボックスオプション
	const otherOptions: CheckboxOption[] = [
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

	return (
		<div className="space-y-2">
			{/* ステータスタイプ選択 */}
			<FilterCheckboxGroup
				options={statusTypeOptions}
				selectedIds={selectedStatusTypes}
				onChange={handleStatusTypeChange}
			/>

			{/* オプション */}
			<FilterCheckboxGroup
				options={otherOptions}
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

			{/* テーブルとページネーション */}
			<div className="overflow-x-auto max-w-full">
				<TablePagination table={table} />

				<SortableTable<ProcessedFriendsStatusListItem, unknown>
					data={filteredData}
					columns={columns}
					state={{ sorting, columnFilters, pagination }}
					onSortingChange={setSorting}
					onColumnFiltersChange={setColumnFilters}
					onPaginationChange={setPagination}
					rowComponent={TableRow}
				/>
			</div>
		</div>
	);
}

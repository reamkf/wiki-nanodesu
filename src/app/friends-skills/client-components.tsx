"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Tabs, Tab, Box, Paper } from "@mui/material";
import { SkillEffect } from "@/types/friendsSkills";
import { FriendsDataRow } from "@/types/friends";
import { SortableTable } from "@/components/table/SortableTable";
import { FriendsNameLink } from "@/components/friends/FriendsNameLink";
import Image from "next/image";
import { ColumnDef, Row, flexRender, SortingState, ColumnFiltersState } from "@tanstack/react-table";

// CSV内の「~~」を改行に変換する関数
function formatTextContent(text: string): React.ReactElement {
	const parts = text.split('~~');

	return (
		<>
			{parts.map((part, index) => (
				<span key={index}>
					{part}
					{index < parts.length - 1 && <br />}
				</span>
			))}
		</>
	);
}

// スキルとフレンズデータを含む結合型
type SkillWithFriend = SkillEffect & {
	friend?: FriendsDataRow
}

export default function ClientTabs({
	effectTypes,
	skillsData
}: {
	effectTypes: string[],
	skillsData: SkillWithFriend[]
}) {
	// formatText関数をメモ化
	const formatText = useCallback((text: string): React.ReactElement => {
		return formatTextContent(text);
	}, []);

	// 効果種別ごとにデータをメモ化
	const effectTypeData = useMemo(() => {
		const result: Record<string, SkillWithFriend[]> = {};

		// 各効果種別ごとにデータをフィルタリング
		effectTypes.forEach(effectType => {
			result[effectType] = skillsData.filter(
				skill => skill.effectType === effectType
			);
		});

		return result;
	}, [effectTypes, skillsData]);

	const [selectedTab, setSelectedTab] = useState(0);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 50
	});

	const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: number) => {
		setSelectedTab(newValue);
		// タブ切り替え時にソートとフィルターをリセット
		setSorting([]);
		setColumnFilters([]);
		setPagination({ pageIndex: 0, pageSize: 50 });
	}, []);

	// テーブルのカラム定義
	const columns = useMemo<ColumnDef<SkillWithFriend>[]>(() => [
		{
			accessorKey: 'friendsId',
			header: 'フレンズ',
			cell: ({ row }) => {
				const skill = row.original;
				if (!skill.friend) {
					return <div>{skill.friendsId}</div>;
				}

				return (
					<div className="flex items-center space-x-2">
						{skill.friend.iconUrl && (
							<div className="flex-shrink-0">
								<Image
									src={skill.friend.iconUrl}
									alt={skill.friend.name}
									width={40}
									height={40}
									className="rounded-sm"
								/>
							</div>
						)}
						<FriendsNameLink friend={skill.friend} />
					</div>
				);
			},
			meta: {
				width: '250px'
			}
		},
		{
			accessorKey: 'skillType',
			header: 'わざ種別',
			meta: {
				width: '120px'
			}
		},
		{
			accessorKey: 'power',
			header: '威力',
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
			meta: {
				width: '200px'
			}
		},
		{
			accessorKey: 'effectTurn',
			header: '効果ターン',
			meta: {
				width: '100px'
			}
		},
		{
			accessorKey: 'activationRate',
			header: '発動率',
			meta: {
				width: '100px'
			}
		},
		{
			accessorKey: 'activationCount',
			header: '発動回数',
			meta: {
				width: '100px'
			}
		},
		{
			accessorKey: 'note',
			header: '備考',
			meta: {
				width: '200px'
			}
		},
	], [formatText]);

	// カスタム行コンポーネント
	const CustomRowComponent = useCallback(({ row }: { row: Row<SkillWithFriend> }) => (
		<tr
			key={row.id}
			className="hover:bg-gray-50"
		>
			{row.getVisibleCells().map(cell => (
				<td key={cell.id} className="p-2 border-b">
					{flexRender(cell.column.columnDef.cell, cell.getContext())}
				</td>
			))}
		</tr>
	), []);

	// 現在選択されている効果種別
	const currentEffectType = effectTypes[selectedTab];
	// 現在の効果種別のデータ
	const currentData = currentEffectType ? effectTypeData[currentEffectType] || [] : [];

	return (
		<>
			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
				<Tabs
					value={selectedTab}
					onChange={handleTabChange}
					variant="scrollable"
					scrollButtons="auto"
					aria-label="効果種別タブ"
				>
					{effectTypes.map((effectType, index) => (
						<Tab key={index} label={effectType} />
					))}
				</Tabs>
			</Box>

			<Box sx={{ p: 0 }}>
				<Paper className="mb-6 overflow-auto">
					<SortableTable
						data={currentData}
						columns={columns}
						state={{
							sorting,
							columnFilters,
							pagination
						}}
						onSortingChange={setSorting}
						onColumnFiltersChange={setColumnFilters}
						onPaginationChange={setPagination}
						rowComponent={CustomRowComponent}
					/>
				</Paper>
			</Box>
		</>
	);
}
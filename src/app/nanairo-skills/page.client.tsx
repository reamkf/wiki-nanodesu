"use client";

import React, { useMemo } from "react";
import { FriendsAttribute, FriendsDataRow } from "@/types/friends";
import { FriendsAttributeIconAndName } from "@/components/friends/FriendsAttributeIconAndName";
import FriendsIcon from "@/components/friends/FriendsIcon";
import { FriendsNameLink } from "@/components/friends/FriendsNameLink";
import { Table, WikiTableColumnDef } from "@/components/table/Table";
import { TextCell } from "@/components/table/GenericDataTable";
import { createCustomFilterFn } from "@/utils/tableFilters";
import { isFriendsAttribute, sortAttribute } from "@/utils/friends/friends";

function getFriendsAttribute(value: unknown): FriendsAttribute {
	return isFriendsAttribute(value) ? value : FriendsAttribute.none;
}

function getRarityText(friend: FriendsDataRow): string {
	return friend.rarity > 0 ? `☆${friend.rarity}` : "";
}

function getSearchableText(friend: FriendsDataRow, columnId: string): string {
	switch (columnId) {
		case "rarity":
			return getRarityText(friend);
		case "friends":
			return [friend.id, friend.name, friend.secondName].join(" ");
		case "attribute":
			return friend.attribute;
		case "effect":
			return friend.nanairoSkillEffect;
		case "implementationDate":
			return friend.implementDate;
		case "implementationType":
			return friend.implementType;
		default:
			return "";
	}
}

function FriendCell({ friend }: { friend: FriendsDataRow }) {
	return (
		<div className="flex items-center gap-2">
			<FriendsIcon friendsData={friend} size={45} />
			<FriendsNameLink friend={friend} />
		</div>
	);
}

export default function NanairoTable({
	data,
	tableId,
	showEffect,
}: {
	data: FriendsDataRow[];
	tableId: string;
	showEffect: boolean;
}) {
	const customFilterFn = useMemo(
		() => createCustomFilterFn<FriendsDataRow>(getSearchableText),
		[],
	);

	const columns = useMemo<WikiTableColumnDef<FriendsDataRow>[]>(() => {
		const baseColumns: WikiTableColumnDef<FriendsDataRow>[] = [
			{
				accessorFn: (row) => row.rarity,
				id: "rarity",
				header: "初期けも級",
				cell: ({ row }) => <span>{getRarityText(row.original)}</span>,
				filterFn: customFilterFn,
				meta: {
					width: "55px",
					align: "center",
				},
			},
			{
				accessorFn: (row) => row.name,
				id: "friends",
				header: "フレンズ",
				cell: ({ row }) => <FriendCell friend={row.original} />,
				filterFn: customFilterFn,
				meta: {
					width: "220px",
				},
			},
			{
				accessorFn: (row) => row.attribute,
				id: "attribute",
				header: "属性",
				cell: ({ row }) => (
					<FriendsAttributeIconAndName
						attribute={getFriendsAttribute(row.original.attribute)}
					/>
				),
				filterFn: customFilterFn,
				sortFn: (rowA, rowB, columnId) =>
					sortAttribute(
						getFriendsAttribute(rowA.getValue(columnId)),
						getFriendsAttribute(rowB.getValue(columnId)),
					),
				meta: {
					width: "80px",
					align: "center",
				},
			},
		];

		if (showEffect) {
			baseColumns.push({
				accessorFn: (row) => row.nanairoSkillEffect,
				id: "effect",
				header: "効果",
				cell: ({ row }) => <TextCell text={row.original.nanairoSkillEffect} />,
				filterFn: customFilterFn,
				meta: {
					width: "430px",
				},
			});
		}

		baseColumns.push(
			{
				accessorFn: (row) => row.implementDate,
				id: "implementationDate",
				header: "実装日",
				cell: ({ row }) => <TextCell text={row.original.implementDate} />,
				filterFn: customFilterFn,
				meta: {
					width: "110px",
				},
			},
			{
				accessorFn: (row) => row.implementType,
				id: "implementationType",
				header: "実装種別",
				cell: ({ row }) => <TextCell text={row.original.implementType} />,
				filterFn: customFilterFn,
				meta: {
					width: "100px",
				},
			},
		);

		return baseColumns;
	}, [customFilterFn, showEffect]);

	return (
		<div className="max-w-full overflow-x-auto">
			<Table data={data} columns={columns} tableId={tableId} />
		</div>
	);
}

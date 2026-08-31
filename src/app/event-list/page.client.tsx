"use client";

import { useMemo } from "react";
import { flexRender, Row } from "@tanstack/react-table";
import { EventDisplayData, EventRelatedFriend, EventRelatedPhoto } from "@/types/event";
import { SeesaaWikiImage } from "@/components/seesaawiki/SeesaaWikiImage";
import { SeesaaWikiLink } from "@/components/seesaawiki/SeesaaWikiLink";
import {
	getColumnMeta,
	Table,
	WikiTableColumnDef,
	WikiTableFeatures,
} from "@/components/table/Table";
import { createCustomFilterFn } from "@/utils/tableFilters";
import { formatEventDate } from "@/utils/eventDate";
import { getWikiNanodaPageUrl } from "@/utils/wikiNanodaUrl";

function getFriendPageName(friend: EventRelatedFriend): string {
	return friend.secondName ? `【${friend.secondName}】${friend.name}` : friend.name;
}

function isRelatedColumn(columnId: string): boolean {
	return columnId.startsWith("friend") || columnId.startsWith("photo");
}

function EventRow({ row }: { row: Row<WikiTableFeatures, EventDisplayData> }) {
	return (
		<tr className="hover:bg-gray-50">
			{row.getVisibleCells().map((cell) => {
				const meta = getColumnMeta(cell.column.columnDef.meta);
				const isEmptyRelatedCell = isRelatedColumn(cell.column.id) && !cell.getValue();

				return (
					<td
						key={cell.id}
						className={`p-2 border-b text-sm${isEmptyRelatedCell ? " bg-gray-100" : ""}`}
						style={{
							textAlign: meta.align || "left",
							height: "auto",
							verticalAlign: "middle",
						}}
					>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</td>
				);
			})}
		</tr>
	);
}

function EventCell({ event }: { event: EventDisplayData }) {
	const content = (
		<>
			<SeesaaWikiImage
				src={event.bannerImageUrl}
				alt={`${event.name}のバナー`}
				width={300}
				height={78}
				className="h-auto w-[300px] object-contain"
			/>
			<span>{event.name}</span>
		</>
	);

	if (!event.wikiPage) {
		return (
			<div className="flex w-[300px] flex-col items-center gap-1 text-center">{content}</div>
		);
	}

	return (
		<SeesaaWikiLink
			href={getWikiNanodaPageUrl(event.wikiPage)}
			className="flex w-[300px] flex-col items-center gap-1 text-center"
		>
			{content}
		</SeesaaWikiLink>
	);
}

function FriendCell({ friend }: { friend: EventRelatedFriend }) {
	return (
		<SeesaaWikiLink
			href={getWikiNanodaPageUrl(getFriendPageName(friend))}
			className="flex flex-col items-center text-center"
		>
			<SeesaaWikiImage
				src={friend.iconUrl}
				alt={getFriendPageName(friend)}
				width={55}
				height={55}
				className="h-[55px] w-[55px] object-contain"
			/>
			{friend.secondName && (
				<span className="text-xs text-red-500">【{friend.secondName}】</span>
			)}
			<span>{friend.name}</span>
		</SeesaaWikiLink>
	);
}

function PhotoCell({ photo }: { photo: EventRelatedPhoto }) {
	return (
		<SeesaaWikiLink
			href={getWikiNanodaPageUrl(photo.name)}
			className="flex flex-col items-center text-center"
		>
			<SeesaaWikiImage
				src={photo.iconUrl}
				alt={photo.name}
				width={55}
				height={55}
				className="h-[55px] w-[55px] object-contain"
			/>
			<span>{photo.name}</span>
		</SeesaaWikiLink>
	);
}

function getSearchableText(row: EventDisplayData, columnId: string): string {
	if (columnId === "event") return `${row.name} ${row.wikiPage}`;
	if (columnId === "startDate") return row.startDate;
	if (columnId === "endDate") return row.endDate;
	if (columnId === "type") return row.type;
	if (columnId.startsWith("friend")) {
		const friend = row.friends[Number(columnId.slice("friend".length)) - 1];
		return friend ? getFriendPageName(friend) : "";
	}
	if (columnId.startsWith("photo")) {
		const photo = row.photos[Number(columnId.slice("photo".length)) - 1];
		return photo?.name || "";
	}
	return "";
}

const customFilterFn = createCustomFilterFn<EventDisplayData>(getSearchableText);

export default function EventTable({ data }: { data: EventDisplayData[] }) {
	const columns = useMemo<WikiTableColumnDef<EventDisplayData>[]>(
		() => [
			{
				accessorFn: (row) => row.name,
				id: "event",
				header: "イベント",
				cell: ({ row }) => <EventCell event={row.original} />,
				filterFn: customFilterFn,
				meta: { width: "320px", align: "center" },
			},
			{
				accessorFn: (row) => row.startDate,
				id: "startDate",
				header: "開始",
				cell: ({ row }) => formatEventDate(row.original.startDate),
				filterFn: customFilterFn,
				meta: { width: "130px", align: "center" },
			},
			{
				accessorFn: (row) => row.endDate,
				id: "endDate",
				header: "終了",
				cell: ({ row }) => formatEventDate(row.original.endDate),
				filterFn: customFilterFn,
				meta: { width: "150px", align: "center" },
			},
			{
				accessorFn: (row) => row.type,
				id: "type",
				header: "種別",
				filterFn: customFilterFn,
				meta: { width: "130px", align: "center" },
			},
			...Array.from({ length: 4 }, (_, index) => ({
				accessorFn: (row: EventDisplayData) => row.friends[index]?.name || "",
				id: `friend${index + 1}`,
				header: `実装フレンズ${index + 1}`,
				cell: ({ row }: { row: { original: EventDisplayData } }) => {
					const friend = row.original.friends[index];
					return friend ? <FriendCell friend={friend} /> : null;
				},
				filterFn: customFilterFn,
				meta: { width: "125px", align: "center" as const },
			})),
			...Array.from({ length: 4 }, (_, index) => ({
				accessorFn: (row: EventDisplayData) => row.photos[index]?.name || "",
				id: `photo${index + 1}`,
				header: `実装フォト${index + 1}`,
				cell: ({ row }: { row: { original: EventDisplayData } }) => {
					const photo = row.original.photos[index];
					return photo ? <PhotoCell photo={photo} /> : null;
				},
				filterFn: customFilterFn,
				meta: { width: "125px", align: "center" as const },
			})),
		],
		[],
	);

	return (
		<div className="max-w-full overflow-x-auto">
			<Table
				data={data}
				columns={columns}
				tableId="event-list"
				rowComponent={EventRow}
				initialState={{ sorting: [{ id: "startDate", desc: true }] }}
			/>
		</div>
	);
}

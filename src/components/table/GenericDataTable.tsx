"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { FilterableDataTable } from "@/components/table/FilterableDataTable";
import { parseSeesaaWikiNewLine } from "@/utils/seesaaWiki";
import { SeesaaWikiImage } from "@/components/seesaawiki/SeesaaWikiImage";
import { FriendsNameLink } from "@/components/friends/FriendsNameLink";
import { FriendsDataRow } from "@/types/friends";
import { PhotoDataRow } from "@/types/photo";
import PhotoIcon from "@/components/photo/PhotoIcon";
import { PhotoNameLink } from "@/components/photo/PhotoNameLink";
import { FriendsOrPhotoSkillType } from "@/types/abnormalStatus";

// 共通型定義
export interface WithFriendOrPhoto {
	isPhoto?: boolean;
	friendsDataRow?: FriendsDataRow;
	photoDataRow?: PhotoDataRow;
	friendsId?: string;
	friendsIdOrPhotoName?: string;
	skillType: FriendsOrPhotoSkillType
}

// ユーティリティ関数
export const formatText = (text: string): React.ReactElement => {
	return parseSeesaaWikiNewLine(text);
};

// SeesaaWikiImageラッパー
export const IconImage = ({ src, alt }: { src?: string; alt?: string }) => {
	if (!src) return null;

	return (
		<div className="shrink-0">
			<SeesaaWikiImage
				src={src}
				alt={alt || ""}
				width={45}
				height={45}
				className="rounded-xs"
			/>
		</div>
	);
};

// フレンズとフォトの表示コンポーネント
export const FriendOrPhotoDisplay = ({ data }: { data: WithFriendOrPhoto }) => {
	if (data.isPhoto && data.photoDataRow) {
		// フォトの場合
		const isChanged = data.skillType?.includes('変化後') || undefined;

		return (
			<div className="text-sm flex items-center space-x-2">
				<PhotoIcon
					photoData={data.photoDataRow}
					size={45}
				/>
				<PhotoNameLink
					photo={data.photoDataRow}
					isChanged={isChanged}
				/>
			</div>
		);
	} else if (!data.isPhoto && data.friendsDataRow) {
		// フレンズの場合
		return (
			<div className="text-sm flex items-center space-x-2">
				<IconImage
					src={data.friendsDataRow.iconUrl}
					alt={data.friendsDataRow.name}
				/>
				<FriendsNameLink friend={data.friendsDataRow} />
			</div>
		);
	} else {
		// データがない場合
		return <div>{data.friendsIdOrPhotoName || data.friendsId}</div>;
	}
};

// テーブルラッパーコンポーネント
export const GenericDataTable = <T extends Record<string, unknown>>({
	data,
	columns,
	tableId
}: {
	data: T[];
	columns: ColumnDef<T, unknown>[];
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

// カラムセル用のテキスト表示コンポーネント
export const TextCell = ({ text }: { text: string | undefined | null }) => {
	if (!text) return null;
	return formatText(text);
};

// 共通の検索可能テキスト取得関数
export const getSearchableTextForFriendOrPhoto = (
	row: WithFriendOrPhoto,
	columnId: string
): string => {
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
				(row as unknown as Record<string, unknown>)[columnId]?.toString() ?? ""
			);
	}
};
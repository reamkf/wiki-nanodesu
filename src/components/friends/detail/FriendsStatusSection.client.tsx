"use client";

import { useState } from "react";
import { FriendsDataRow } from "@/types/friends";
import { DetailSection, SegmentGroup } from "./DetailParts";
import { FriendsStatusView } from "./FriendsStatusView";

export const FRIENDS_STATUS_LEVELS = [90, 99, 150, 200] as const;
export type FriendsStatusLevel = (typeof FRIENDS_STATUS_LEVELS)[number];
export type FriendsStatusYasei = 4 | 5;

export function getFriendsStatus(
	friend: FriendsDataRow,
	level: FriendsStatusLevel,
	yasei: FriendsStatusYasei,
) {
	if (level === 90) return yasei === 5 ? friend.status.status90Yasei5 : friend.status.status90;
	if (level === 99) return yasei === 5 ? friend.status.status99Yasei5 : friend.status.status99;
	if (level === 150) return yasei === 5 ? friend.status.status150Yasei5 : friend.status.status150;
	return yasei === 5 ? friend.status.status200Yasei5 : friend.status.status200;
}

export function FriendsStatusSection({ friend }: { friend: FriendsDataRow }) {
	const [level, setLevel] = useState<FriendsStatusLevel>(90);
	const [yasei, setYasei] = useState<FriendsStatusYasei>(4);

	// 野生大解放がないフレンズでは野生5を選べないため、表示値を野生4に倒す
	const effectiveYasei: FriendsStatusYasei = friend.hasYasei5 ? yasei : 4;
	const status = getFriendsStatus(friend, level, effectiveYasei);

	return (
		<DetailSection title="ステータス" id="status">
			<div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2">
				<SegmentGroup
					label="レベル"
					value={level}
					onChange={setLevel}
					options={FRIENDS_STATUS_LEVELS.map((value) => ({
						value,
						label: `Lv${value}`,
					}))}
				/>
				<SegmentGroup
					label="野生解放"
					value={effectiveYasei}
					onChange={setYasei}
					options={[
						{ value: 4 as FriendsStatusYasei, label: "野生4" },
						{
							value: 5 as FriendsStatusYasei,
							label: "野生5",
							disabled: !friend.hasYasei5,
						},
					]}
				/>
			</div>
			<FriendsStatusView
				status={status}
				avoid={effectiveYasei === 5 ? friend.status.avoidYasei5 : friend.status.avoid}
				plasm={friend.status.plasm}
			/>
			{status.estimated && (
				<p className="mt-2 text-sm italic text-red-600">斜体は推測値です。</p>
			)}
		</DetailSection>
	);
}

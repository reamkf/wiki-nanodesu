"use client";

import { useState } from "react";
import { FriendsDataRow } from "@/types/friends";
import { FriendsStatusView } from "./FriendsStatusView";

const LEVELS = [90, 99, 150, 200] as const;
type Level = (typeof LEVELS)[number];
type Yasei = 4 | 5;

function getStatus(friend: FriendsDataRow, level: Level, yasei: Yasei) {
	if (level === 90) return yasei === 5 ? friend.status.status90Yasei5 : friend.status.status90;
	if (level === 99) return yasei === 5 ? friend.status.status99Yasei5 : friend.status.status99;
	if (level === 150) return yasei === 5 ? friend.status.status150Yasei5 : friend.status.status150;
	return yasei === 5 ? friend.status.status200Yasei5 : friend.status.status200;
}

export function FriendsStatusSection({ friend }: { friend: FriendsDataRow }) {
	const [level, setLevel] = useState<Level>(90);
	const [yasei, setYasei] = useState<Yasei>(4);
	const status = getStatus(friend, level, yasei);

	return (
		<section className="mb-6">
			<h2 className="mb-3 border-b-2 border-sky-300 pb-1 text-lg font-bold">ステータス</h2>
			<div className="mb-3 flex flex-wrap items-center gap-3">
				<label className="font-semibold" htmlFor="friends-status-level">
					レベル
				</label>
				<select
					id="friends-status-level"
					className="rounded border border-gray-300 bg-white px-2 py-1"
					value={level}
					onChange={(event) => setLevel(Number(event.target.value) as Level)}
				>
					{LEVELS.map((value) => (
						<option key={value} value={value}>
							Lv{value}
						</option>
					))}
				</select>
				<label className="font-semibold" htmlFor="friends-status-yasei">
					野生解放
				</label>
				<select
					id="friends-status-yasei"
					className="rounded border border-gray-300 bg-white px-2 py-1"
					value={yasei}
					onChange={(event) => setYasei(Number(event.target.value) as Yasei)}
				>
					<option value={4}>野生4</option>
					<option value={5} disabled={!friend.hasYasei5}>
						野生5
					</option>
				</select>
			</div>
			<FriendsStatusView
				status={status}
				avoid={yasei === 5 ? friend.status.avoidYasei5 : friend.status.avoid}
				plasm={friend.status.plasm}
			/>
			{status.estimated && (
				<p className="mt-2 text-sm italic text-red-600">斜体は推測値です。</p>
			)}
		</section>
	);
}
